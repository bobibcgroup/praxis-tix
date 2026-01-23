import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, ShoppingBag } from 'lucide-react';
import { triggerConfettiBurst } from '@/lib/confetti';
import { useSEO } from '@/hooks/useSEO';
import type { Outfit } from '@/types/praxis';

export default function AgentTryOn() {
  const navigate = useNavigate();
  const location = useLocation();
  useSEO();
  
  const { outfit, tryOnImage, userPhoto } = (location.state as { 
    outfit?: Outfit;
    tryOnImage?: string;
    userPhoto?: string;
  }) || {};

  useEffect(() => {
    if (!outfit || !tryOnImage) {
      navigate('/agent/results');
      return;
    }
    triggerConfettiBurst();
  }, [outfit, tryOnImage, navigate]);

  if (!outfit || !tryOnImage) {
    return null;
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${outfit.title} - Try On`,
          text: `Check out how I look in ${outfit.title}!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // toast.success('Link copied to clipboard');
      }
    } catch (err) {
      // User cancelled or error
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = tryOnImage;
    link.download = `tryon-${outfit.id}.jpg`;
    link.click();
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
                Virtual Try-On
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4 max-w-2xl mx-auto">
        <div className="space-y-6 py-6">
          {/* Try-on Image */}
          <div className="rounded-xl overflow-hidden border border-border bg-card">
            <img
              src={tryOnImage}
              alt={`Try-on: ${outfit.title}`}
              className="w-full h-auto"
            />
          </div>

          {/* Outfit Info */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h2 className="text-lg font-medium">{outfit.title}</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-16 shrink-0">Top</span>
                <span className="text-foreground">{outfit.items.top}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-16 shrink-0">Bottom</span>
                <span className="text-foreground">{outfit.items.bottom}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-16 shrink-0">Shoes</span>
                <span className="text-foreground">{outfit.items.shoes}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="default"
              onClick={() => navigate('/agent/purchase', { state: { outfit } })}
              className="flex-1"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
