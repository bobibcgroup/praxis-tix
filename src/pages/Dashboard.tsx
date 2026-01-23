import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Heart, UtensilsCrossed, Briefcase, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { getOutfitHistory } from '@/lib/userService';
import type { OutfitHistoryEntry } from '@/lib/userService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [recentStyles, setRecentStyles] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      loadRecentStyles();
    } else {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const loadRecentStyles = async () => {
    if (!user) return;
    try {
      const history = await getOutfitHistory(user.id);
      setRecentStyles(history.slice(0, 3)); // Show 3 most recent
    } catch (error) {
      console.error('Error loading recent styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOccasionClick = (occasion: string) => {
    navigate('/', { state: { occasion: occasion.toUpperCase() } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

        {/* Recent Styles (if authenticated) */}
        {isLoaded && user && !loading && recentStyles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-medium text-foreground mb-4">Recent Styles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentStyles.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => navigate('/history')}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {entry.tryOnImageUrl && (
                    <img
                      src={entry.tryOnImageUrl}
                      alt={entry.outfitData.title}
                      className="w-full aspect-[3/4] rounded-lg object-cover mb-3"
                    />
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
