import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Image as ImageIcon } from 'lucide-react';
import { getFavoritedOutfits, removeFromFavorites } from '@/lib/userService';
import type { OutfitHistoryEntry } from '@/lib/userService';
import Header from '@/components/Header';

const Favorites = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        navigate('/');
        return;
      }

      loadFavorites();
    }
  }, [user, isLoaded]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const entries = await getFavoritedOutfits(user.id);
      setFavorites(entries);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (outfitId: number) => {
    if (!user) return;

    try {
      await removeFromFavorites(user.id, outfitId);
      setFavorites(prev => prev.filter(entry => entry.outfitId !== outfitId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to flow
          </Button>
          <h1 className="text-3xl font-medium text-foreground mb-2">Your Favorites</h1>
          <p className="text-muted-foreground">
            Outfits you've saved for later
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Looks you save will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {/* Make entire card tappable - could navigate to detail view */}}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full md:w-48 aspect-[3/4] rounded-lg overflow-hidden bg-muted shrink-0 relative">
                    {entry.tryOnImageUrl ? (
                      <img
                        src={entry.tryOnImageUrl}
                        alt={entry.outfitData.title}
                        className="w-full h-full object-cover"
                      />
                    ) : entry.outfitData.imageUrl ? (
                      <img
                        src={entry.outfitData.imageUrl}
                        alt={entry.outfitData.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(entry.outfitId)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-primary text-primary" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-foreground">
                          {entry.outfitData.title}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {entry.occasion.toLowerCase()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.selectedAt)}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">Top</span>
                        <span className="text-foreground">{entry.outfitData.items.top}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">Bottom</span>
                        <span className="text-foreground">{entry.outfitData.items.bottom}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-16 shrink-0">Shoes</span>
                        <span className="text-foreground">{entry.outfitData.items.shoes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
