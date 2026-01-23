import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { triggerConfettiBurst } from '@/lib/confetti';
import type { Outfit } from '@/types/praxis';
import { useSEO } from '@/hooks/useSEO';

// Dummy purchase data - replace with real data later
const getPurchaseLinks = (outfit: Outfit) => {
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

export default function AgentPurchase() {
  const navigate = useNavigate();
  const location = useLocation();
  useSEO();
  
  const outfit = (location.state as { outfit?: Outfit })?.outfit;
  
  useEffect(() => {
    if (!outfit) {
      navigate('/agent/results');
      return;
    }
    triggerConfettiBurst();
  }, [outfit, navigate]);

  if (!outfit) {
    return null;
  }

  const purchaseLinks = getPurchaseLinks(outfit);

  const handleRestart = () => {
    // Clear agent state
    localStorage.removeItem('praxis_agent_state');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="px-4 md:px-6 h-14 flex items-center w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/agent/results')}
                className="shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-serif text-xl font-medium text-foreground tracking-wide">
                Complete Your Look
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4 max-w-2xl mx-auto">
        <div className="space-y-6 py-6">
          {/* Outfit Image */}
          {outfit.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border">
              <img
                src={outfit.imageUrl}
                alt={outfit.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              You can shop pieces individually.
            </p>
          </div>

          {/* Purchase Links */}
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

        {/* Bottom actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
          <div className="space-y-3 max-w-md mx-auto">
            <Button onClick={handleRestart} variant="outline" size="lg" className="w-full text-muted-foreground">
              Style another moment
            </Button>
            <button
              onClick={() => navigate('/agent/results')}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            >
              Back to outfit selection
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
