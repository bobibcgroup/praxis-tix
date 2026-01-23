import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Image as ImageIcon, Trash2, Heart, Search, Filter, X, Maximize2, Palette, RefreshCw, Loader2 } from 'lucide-react';
import { getOutfitHistory, deleteOutfitFromHistory, addToFavorites, removeFromFavorites, getFavorites } from '@/lib/userService';
import type { OutfitHistoryEntry } from '@/lib/userService';
import Header from '@/components/Header';
import HistoryDetailModal from '@/components/app/HistoryDetailModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OccasionType } from '@/types/praxis';

const History = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [history, setHistory] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [generatingEntryIds, setGeneratingEntryIds] = useState<Set<string>>(new Set());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OutfitHistoryEntry | null>(null);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        console.log('History page: No user, redirecting to home');
        navigate('/');
        return;
      }

      console.log('History page: User loaded, loading history for:', user.id);
      loadHistory();
    } else {
      console.log('History page: User state not loaded yet');
    }
  }, [user, isLoaded, navigate]);

  // Listen for generation completion to refresh history
  useEffect(() => {
    if (!user) return;
    
    const handleGenerationComplete = () => {
      console.log('🔄 History page: Generation complete, refreshing history...');
      // Clear generating state
      setGeneratingEntryIds(new Set());
      // Small delay to ensure database update completes before refreshing
      setTimeout(() => {
        loadHistory();
      }, 500);
    };

    // Check for active generations periodically
    const checkInterval = setInterval(() => {
      // Re-check active generations with current history
      const activeGenStr = localStorage.getItem('praxis_active_generation');
      const generatingIds = new Set<string>();
      
      if (activeGenStr && history.length > 0) {
        try {
          const activeGen = JSON.parse(activeGenStr);
          history.forEach(entry => {
            if ((entry.id === activeGen.historyEntryId || 
                 entry.outfitId === activeGen.outfitId) &&
                !entry.tryOnImageUrl) {
              generatingIds.add(entry.id);
            }
          });
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      setGeneratingEntryIds(generatingIds);
    }, 2000);

    window.addEventListener('generation-complete', handleGenerationComplete as EventListener);
    
    return () => {
      window.removeEventListener('generation-complete', handleGenerationComplete as EventListener);
      clearInterval(checkInterval);
    };
  }, [user, history]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Loading history for user:', {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        allEmails: user.emailAddresses?.map(e => e.emailAddress) || [],
        createdAt: user.createdAt,
      });
      const entries = await getOutfitHistory(user.id);
      console.log('✅ Loaded history entries:', entries.length);
      console.log('📋 History entries details:', entries.map(e => ({
        id: e.id,
        outfitId: e.outfitId,
        title: e.outfitData?.title,
        occasion: e.occasion,
        hasTryOnImage: !!e.tryOnImageUrl,
        selectedAt: e.selectedAt
      })));
      setHistory(entries);
      const favs = await getFavorites(user.id);
      setFavorites(favs);
      
      // Check for active generations and mark entries as generating
      checkActiveGenerations(entries);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveGenerations = (entries: OutfitHistoryEntry[]) => {
    const activeGenStr = localStorage.getItem('praxis_active_generation');
    const generatingIds = new Set<string>();
    
    if (activeGenStr) {
      try {
        const activeGen = JSON.parse(activeGenStr);
        // Find entries that match the active generation
        entries.forEach(entry => {
          // Match by historyEntryId or outfitId
          if (entry.id === activeGen.historyEntryId || 
              entry.outfitId === activeGen.outfitId) {
            // Only mark as generating if it doesn't have a try-on image yet
            if (!entry.tryOnImageUrl) {
              generatingIds.add(entry.id);
            }
          }
        });
      } catch (e) {
        console.warn('Error parsing active generation:', e);
      }
    }
    
    setGeneratingEntryIds(generatingIds);
  };

  const handleDelete = async () => {
    if (!user || !outfitToDelete) return;

    try {
      await deleteOutfitFromHistory(user.id, outfitToDelete);
      setHistory(prev => prev.filter(entry => entry.id !== outfitToDelete));
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  const handleToggleFavorite = async (outfitId: number) => {
    if (!user) return;

    try {
      if (favorites.includes(outfitId)) {
        await removeFromFavorites(user.id, outfitId);
        setFavorites(prev => prev.filter(id => id !== outfitId));
      } else {
        await addToFavorites(user.id, outfitId);
        setFavorites(prev => [...prev, outfitId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  // Filter and sort history
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history;

    // Filter by occasion
    if (occasionFilter !== 'all') {
      filtered = filtered.filter(entry => 
        entry.occasion.toLowerCase() === occasionFilter.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => {
        const title = entry.outfitData.title?.toLowerCase() || '';
        const styleName = entry.styleName?.toLowerCase() || '';
        const top = entry.outfitData.items.top?.toLowerCase() || '';
        const bottom = entry.outfitData.items.bottom?.toLowerCase() || '';
        const shoes = entry.outfitData.items.shoes?.toLowerCase() || '';
        return title.includes(query) || styleName.includes(query) || 
               top.includes(query) || bottom.includes(query) || shoes.includes(query);
      });
    }

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.selectedAt).getTime();
      const dateB = new Date(b.selectedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [history, occasionFilter, searchQuery, sortOrder]);

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
            <p className="text-muted-foreground">Loading your history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8 max-w-4xl">
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-medium text-foreground mb-2">Your Outfit History</h1>
              <p className="text-muted-foreground">
                Previously selected outfits and personalized looks
              </p>
            </div>
            <Button
              onClick={loadHistory}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="mb-2"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        {history.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Full-width search on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search outfits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={occasionFilter} onValueChange={setOccasionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Occasions</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No outfit history yet</p>
            <Button onClick={() => navigate('/')} variant="cta">
              Start styling
            </Button>
          </div>
        ) : filteredAndSortedHistory.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No outfits match your filters</p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setOccasionFilter('all');
              }} 
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedHistory.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setDetailModalOpen(true);
                }}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Image - more compact on mobile */}
                  <div 
                    className="w-full md:w-40 aspect-[3/4] rounded-lg overflow-hidden bg-muted shrink-0 relative group cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {generatingEntryIds.has(entry.id) ? (
                      // Show generating state
                      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 relative">
                        {entry.outfitData.imageUrl && (
                          <img
                            src={entry.outfitData.imageUrl}
                            alt={entry.outfitData.title}
                            className="w-full h-full object-cover opacity-30"
                          />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-xs text-muted-foreground font-medium">Generating...</p>
                        </div>
                      </div>
                    ) : entry.tryOnImageUrl ? (
                      // Show try-on image (prioritize over original)
                      <>
                        <img
                          src={entry.tryOnImageUrl}
                          alt={entry.outfitData.title}
                          className="w-full h-full object-cover"
                          onClick={() => handleImageClick(entry.tryOnImageUrl!)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(entry.tryOnImageUrl!);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Enlarge image"
                        >
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </>
                    ) : entry.outfitData.imageUrl ? (
                      // Show original outfit image
                      <>
                        <img
                          src={entry.outfitData.imageUrl}
                          alt={entry.outfitData.title}
                          className="w-full h-full object-cover"
                          onClick={() => handleImageClick(entry.outfitData.imageUrl!)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(entry.outfitData.imageUrl!);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          aria-label="Enlarge image"
                        >
                          <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(entry.outfitId);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors duration-200 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={favorites.includes(entry.outfitId) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart 
                        className={`w-4 h-4 ${favorites.includes(entry.outfitId) ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                      />
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

                    {/* Style Name */}
                    {entry.styleName && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-foreground">{entry.styleName}</p>
                      </div>
                    )}

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

                    {/* Style DNA */}
                    {entry.styleDNA && (
                      <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Palette className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">Style DNA</span>
                        </div>
                        <div className="space-y-1">
                          {entry.styleDNA.primaryStyle && (
                            <p className="text-xs text-foreground capitalize">
                              {entry.styleDNA.primaryStyle.toLowerCase().replace('_', ' ')}
                            </p>
                          )}
                          {entry.styleDNA.secondaryStyle && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {entry.styleDNA.secondaryStyle.toLowerCase().replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Color Palette */}
                    {entry.colorPalette && entry.colorPalette.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">Color Palette</p>
                        <div className="flex gap-2">
                          {entry.colorPalette.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-8 rounded-full border border-border"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete button - icon only, secondary action */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOutfitToDelete(entry.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                        aria-label="Delete outfit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Outfit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this outfit from your history? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="sr-only">
              Enlarged image
            </DialogHeader>
            {lightboxImage && (
              <div className="relative">
                <img
                  src={lightboxImage}
                  alt="Enlarged outfit"
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* History Detail Modal */}
      <HistoryDetailModal
        open={detailModalOpen}
        entry={selectedEntry}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEntry(null);
        }}
      />
    </div>
  );
};

export default History;
