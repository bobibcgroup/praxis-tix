import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Heart, UtensilsCrossed, Briefcase, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/Header';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { getOutfitHistory } from '@/lib/userService';
import type { OutfitHistoryEntry } from '@/lib/userService';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [recentStyles, setRecentStyles] = useState<OutfitHistoryEntry[]>([]);
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGeneration, setActiveGeneration] = useState<{
    outfitId: number;
    outfitTitle: string;
    startedAt: string;
    status: string;
  } | null>(null);

  const loadRecentStyles = useCallback(async () => {
    if (!user) return;
    try {
      const history = await getOutfitHistory(user.id);
      setRecentStyles(history.slice(0, 3)); // Show 3 most recent
    } catch (error) {
      console.error('Error loading recent styles:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadGeneratedOutfits = useCallback(async () => {
    if (!user) return;
    try {
      const history = await getOutfitHistory(user.id);
      // Filter to only show outfits that have been generated (have try-on images)
      const generated = history.filter(entry => entry.tryOnImageUrl);
      // Show 6 most recent generated outfits
      setGeneratedOutfits(generated.slice(0, 6));
    } catch (error) {
      console.error('Error loading generated outfits:', error);
    }
  }, [user]);

  const checkActiveGeneration = () => {
    const stored = localStorage.getItem('praxis_active_generation');
    if (stored) {
      try {
        const generation = JSON.parse(stored);
        setActiveGeneration(generation);
      } catch (e) {
        localStorage.removeItem('praxis_active_generation');
        setActiveGeneration(null);
      }
    } else {
      setActiveGeneration(null);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      loadRecentStyles();
      loadGeneratedOutfits();
      checkActiveGeneration();
    } else {
      setLoading(false);
    }
  }, [user, isLoaded, loadRecentStyles, loadGeneratedOutfits]);

  // Check for active generation on mount and listen for completion
  useEffect(() => {
    checkActiveGeneration();

    // Listen for generation completion events
    const handleGenerationComplete = (event: CustomEvent) => {
      setActiveGeneration(null);
      loadRecentStyles(); // Refresh to show new entry
      loadGeneratedOutfits(); // Refresh generated outfits section
      toast.success('Your style image is ready!');
    };

    window.addEventListener('generation-complete', handleGenerationComplete as EventListener);
    
    // Check periodically for completion (in case user navigated away and back)
    const interval = setInterval(() => {
      checkActiveGeneration();
    }, 2000);

    return () => {
      window.removeEventListener('generation-complete', handleGenerationComplete as EventListener);
      clearInterval(interval);
    };
  }, [loadRecentStyles, loadGeneratedOutfits]);

  const handleOccasionClick = (occasion: string) => {
    navigate('/', { state: { occasion: occasion.toUpperCase() } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-medium text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Quick access to style recommendations
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Button
            onClick={() => handleOccasionClick('WORK')}
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2"
          >
            <Briefcase className="w-6 h-6" />
            <span>Meeting</span>
          </Button>
          <Button
            onClick={() => handleOccasionClick('WEDDING')}
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2"
          >
            <Heart className="w-6 h-6" />
            <span>Wedding</span>
          </Button>
          <Button
            onClick={() => handleOccasionClick('DINNER')}
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2"
          >
            <UtensilsCrossed className="w-6 h-6" />
            <span>Dinner</span>
          </Button>
          <Button
            onClick={() => handleOccasionClick('DATE')}
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2"
          >
            <Calendar className="w-6 h-6" />
            <span>Date</span>
          </Button>
        </div>

        {/* Other Occasion */}
        <div className="mb-12">
          <Button
            onClick={() => handleOccasionClick('PARTY')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Other Occasion
          </Button>
        </div>

        {/* Active Generation Alert */}
        {isLoaded && user && activeGeneration && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Generating your style image
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {activeGeneration.outfitTitle} is being processed. This may take a few moments.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="text-xs"
                >
                  View History
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Latest Generated Outfits (if authenticated) */}
        {isLoaded && user && !loading && generatedOutfits.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-foreground">Latest Generated Outfits</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                className="text-xs"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedOutfits.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate('/history')}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors duration-200 cursor-pointer"
                >
                  {entry.tryOnImageUrl ? (
                    <img
                      src={entry.tryOnImageUrl}
                      alt={entry.outfitData.title}
                      className="w-full aspect-[3/4] rounded-lg object-cover mb-3"
                    />
                  ) : entry.outfitData.imageUrl ? (
                    <img
                      src={entry.outfitData.imageUrl}
                      alt={entry.outfitData.title}
                      className="w-full aspect-[3/4] rounded-lg object-cover mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-lg bg-muted flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {entry.outfitData.title}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {entry.occasion.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Styles (if authenticated and no generated outfits yet) */}
        {isLoaded && user && !loading && generatedOutfits.length === 0 && recentStyles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-medium text-foreground mb-4">Recent Styles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentStyles.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate('/history')}
                  className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors duration-200 cursor-pointer"
                >
                  {entry.tryOnImageUrl ? (
                    <img
                      src={entry.tryOnImageUrl}
                      alt={entry.outfitData.title}
                      className="w-full aspect-[3/4] rounded-lg object-cover mb-3"
                    />
                  ) : entry.outfitData.imageUrl ? (
                    <img
                      src={entry.outfitData.imageUrl}
                      alt={entry.outfitData.title}
                      className="w-full aspect-[3/4] rounded-lg object-cover mb-3"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-lg bg-muted flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {entry.outfitData.title}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {entry.occasion.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
