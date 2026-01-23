import { Button } from '@/components/ui/button';
import { ShoppingBag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { OutfitHistoryEntry } from '@/lib/userService';

interface HistoryDetailModalProps {
  open: boolean;
  entry: OutfitHistoryEntry | null;
  onClose: () => void;
}

// Dummy purchase data - replace with real data later
const getPurchaseLinks = (outfit: OutfitHistoryEntry['outfitData']) => {
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

const HistoryDetailModal = ({ open, entry, onClose }: HistoryDetailModalProps) => {
  if (!entry) return null;

  const purchaseLinks = getPurchaseLinks(entry.outfitData);
  const displayImage = entry.tryOnImageUrl || entry.outfitData.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {entry.styleName || entry.outfitData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Outfit Image */}
          {displayImage && (
            <div className="rounded-xl overflow-hidden border border-border">
              <img
                src={displayImage}
                alt={entry.outfitData.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Outfit Details */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">{entry.outfitData.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {entry.occasion.toLowerCase()}
            </p>
            {entry.outfitData.reason && (
              <p className="text-sm text-muted-foreground mt-2">{entry.outfitData.reason}</p>
            )}
          </div>

          {/* Purchase Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Shop this look</h4>
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
      </DialogContent>
    </Dialog>
  );
};

export default HistoryDetailModal;
