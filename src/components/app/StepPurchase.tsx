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
      <div className="space-y-6">
        <div className="text-center mb-6">
          <p className="text-muted-foreground mb-4">
            Shop the pieces from your chosen outfit
          </p>
        </div>

        {/* Outfit Summary */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="text-lg font-medium text-foreground mb-3">{outfit.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top</span>
              <span className="text-foreground">{outfit.items.top}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bottom</span>
              <span className="text-foreground">{outfit.items.bottom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shoes</span>
              <span className="text-foreground">{outfit.items.shoes}</span>
            </div>
          </div>
        </div>

        {/* Purchase Links */}
        <div className="space-y-3">
          {purchaseLinks.map((link, index) => (
            <div
              key={index}
              className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="text-foreground font-medium mb-1">{link.item}</p>
                <p className="text-sm text-muted-foreground">{link.store}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-foreground">{link.price}</span>
                <Button
                  onClick={() => window.open(link.url, '_blank')}
                  variant="cta"
                  size="sm"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Buy this
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <Button onClick={onRestart} variant="outline" size="lg" className="w-full">
            Style another moment
          </Button>
          <button
            onClick={onBack}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to outfit selection
          </button>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepPurchase;
