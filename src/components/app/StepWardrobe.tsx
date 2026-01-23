import { useState, useRef, useCallback } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';
import type { WardrobeItems } from '@/types/praxis';

interface StepWardrobeProps {
  onWardrobeUpdate: (items: WardrobeItems) => void;
  onSkip: () => void;
  onBack: () => void;
  onContinue: (items: WardrobeItems) => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const WARDROBE_CATEGORIES = [
  { id: 'top', label: 'Top', helper: 'Shirts, polos, tees, knitwear' },
  { id: 'jacket', label: 'Jacket / Layer', helper: 'Blazer, jacket, coat, overshirt' },
  { id: 'bottom', label: 'Bottom', helper: 'Jeans, trousers, chinos' },
  { id: 'shoes', label: 'Shoes', helper: 'Sneakers, loafers, boots, oxfords' },
] as const;

const StepWardrobe = ({ onWardrobeUpdate, onSkip, onBack, onContinue }: StepWardrobeProps) => {
  const [items, setItems] = useState<WardrobeItems>({
    top: null,
    jacket: null,
    bottom: null,
    shoes: null,
  });
  
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasAnyUploads = Object.values(items).some(item => item !== null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileChange = useCallback((categoryId: keyof WardrobeItems) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newItems = { ...items, [categoryId]: result };
      setItems(newItems);
      onWardrobeUpdate(newItems);
    };
    reader.readAsDataURL(file);
    
    event.target.value = '';
  }, [items, onWardrobeUpdate]);

  const handleUploadClick = (categoryId: string) => {
    fileInputRefs.current[categoryId]?.click();
  };

  const handleRemoveItem = (categoryId: keyof WardrobeItems) => {
    const newItems = { ...items, [categoryId]: null };
    setItems(newItems);
    onWardrobeUpdate(newItems);
  };

  const handleContinue = () => {
    onContinue(items);
  };

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <FlowStep 
      title="Style what you already own"
      subtitle="One item is enough."
    >
      <div className="space-y-2.5">
        {WARDROBE_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const hasItem = items[category.id as keyof WardrobeItems] !== null;
          
          return (
            <div key={category.id}>
              {/* Hidden file input */}
              <input
                ref={el => fileInputRefs.current[category.id] = el}
                type="file"
                accept="image/*"
                onChange={handleFileChange(category.id as keyof WardrobeItems)}
                className="hidden"
                aria-label={`Upload ${category.label}`}
              />

              {hasItem ? (
                // Uploaded state
                <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    <img 
                      src={items[category.id as keyof WardrobeItems]!} 
                      alt={category.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-tl-lg flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-foreground font-medium">{category.label}</span>
                    <p className="text-xs text-primary">Uploaded</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(category.id as keyof WardrobeItems)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Remove ${category.label}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Accordion style on mobile - collapsed by default
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedCategory(null);
                      } else {
                        setExpandedCategory(category.id);
                        handleUploadClick(category.id);
                      }
                    }}
                    className="w-full flex items-center gap-3 py-3 px-4 bg-background hover:bg-muted/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/20 flex-shrink-0">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-foreground block">{category.label}</span>
                      {!isExpanded && (
                        <span className="text-xs text-muted-foreground">{category.helper}</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <Button
          onClick={handleContinue}
          variant="cta"
          size="lg"
          className="w-full"
        >
          Build my look
        </Button>
        
        {!hasAnyUploads && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-3 text-center text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            Skip
          </button>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          Back
        </button>
      </div>
    </FlowStep>
  );
};

export default StepWardrobe;
