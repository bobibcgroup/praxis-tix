import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import FlowStep from './FlowStep';
import type { Outfit } from '@/types/praxis';

interface StepPurchaseProps {
  outfit: Outfit;
  onBack: () => void;
  onRestart: () => void;
}

// Dummy purchase data - replace with real data later
const getPurchaseLinks = (outfit: Outfit) => {
  // Generate dummy purchase links based on outfit items
  return [
    {
      item: outfit.items.top,
      price: '$89',
      url: 'https://example.com/buy-top',
      store: 'Example Store',
    },
    {
      item: outfit.items.bottom,
      price: '$129',
      url: 'https://example.com/buy-bottom',
      store: 'Example Store',
    },
    {
      item: outfit.items.shoes,
      price: '$159',
      url: 'https://example.com/buy-shoes',
      store: 'Example Store',
    },
  ];
};

const StepPurchase = ({ outfit, onBack, onRestart }: StepPurchaseProps) => {
  const purchaseLinks = getPurchaseLinks(outfit);

  return (
    <FlowStep title="Complete Your Look">
      <div className="space-y-6 pb-20">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            You can shop pieces individually.
          </p>
        </div>

        {/* Purchase Links - Vertical list */}
        <div className="space-y-3">
          {purchaseLinks.map((link, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border p-6 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-foreground font-medium mb-1">{link.item}</p>
                  <p className="text-sm text-muted-foreground">{link.store}</p>
                </div>
                <span className="text-lg font-medium text-foreground ml-4">{link.price}</span>
              </div>
              <Button
                onClick={() => window.open(link.url, '_blank')}
                variant="cta"
                size="lg"
                className="w-full md:w-auto"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buy this
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky bottom actions on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
        <div className="space-y-3 max-w-md mx-auto">
          <Button onClick={onRestart} variant="outline" size="lg" className="w-full text-muted-foreground">
            Style another moment
          </Button>
          <button
            onClick={onBack}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            Back to outfit selection
          </button>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepPurchase;
