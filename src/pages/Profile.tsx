import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Palette, Ruler, Heart, Check } from 'lucide-react';
import { getUserProfile } from '@/lib/userService';
import { syncUserDataOnSignIn } from '@/lib/userSync';
import type { PersonalData } from '@/types/praxis';
import Header from '@/components/Header';
import { getRecommendedSwatches, getMetalRecommendations } from '@/lib/personalOutfitGenerator';
import { StyleDNARadarChart, getRadarValuesFromPersonal } from '@/components/app/StyleDNARadarChart';

// Default color swatches when no photo analysis
const DEFAULT_SWATCHES = [
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Slate Grey', hex: '#6b7280' },
  { name: 'Burgundy', hex: '#722f37' },
  { name: 'Forest Green', hex: '#228b22' },
];

// Default metal recommendation
const DEFAULT_METALS = 'Silver, Gold, Rose Gold';

const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<PersonalData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserProfile(user.id);
      setProfile(data);
      console.log('✅ Profile loaded:', data ? 'has styleDNA' : 'no profile');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        navigate('/');
        return;
      }

      // Sync user data on sign-in (migrate from other user IDs with same email)
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        syncUserDataOnSignIn(user.id, email).then(syncResult => {
          if (syncResult.migrated) {
            console.log('✅ User data synced on Profile:', {
              historyMigrated: syncResult.historyMigrated,
              favoritesMigrated: syncResult.favoritesMigrated,
              profileMigrated: syncResult.profileMigrated,
            });
            // Reload profile after sync
            setTimeout(() => {
              loadProfile();
            }, 500);
          } else {
            // No migration needed, just load profile
            loadProfile();
          }
        }).catch(err => {
          console.error('❌ Error syncing user data:', err);
          // Still load profile even if sync fails
          loadProfile();
        });
      } else {
        loadProfile();
      }
    }
  }, [user, isLoaded, location.pathname, loadProfile, navigate]); // Reload when route changes

  // Also reload when page comes into focus (in case profile was updated in another tab/window)
  useEffect(() => {
    const handleFocus = () => {
      if (isLoaded && user) {
        console.log('🔄 Profile page focused, reloading profile...');
        loadProfile();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoaded, user, loadProfile]);

  // Reload profile when image generation completes or profile refresh is requested
  useEffect(() => {
    if (!user) return;

    const handleGenerationComplete = () => {
      console.log('🔄 Profile page: Generation complete, reloading profile...');
      // Small delay to ensure database update completes
      setTimeout(() => {
        loadProfile();
      }, 500);
    };

    const handleProfileRefresh = () => {
      console.log('🔄 Profile page: Refresh requested, reloading profile...');
      // Small delay to ensure database update completes
      setTimeout(() => {
        loadProfile();
      }, 500);
    };

    window.addEventListener('generation-complete', handleGenerationComplete as EventListener);
    window.addEventListener('profile-should-refresh', handleProfileRefresh as EventListener);
    return () => {
      window.removeEventListener('generation-complete', handleGenerationComplete as EventListener);
      window.removeEventListener('profile-should-refresh', handleProfileRefresh as EventListener);
    };
  }, [user, loadProfile]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get color swatches - use detected or defaults; fallback to localStorage for older profiles
  const skinToneBucket = profile?.skinTone?.bucket;
  let detectedSwatches = skinToneBucket ? getRecommendedSwatches(skinToneBucket) : null;
  let colorSwatches = detectedSwatches && detectedSwatches.length > 0
    ? detectedSwatches.slice(0, 4).map(s => ({ name: s.name, hex: s.hex }))
    : DEFAULT_SWATCHES;
  let metalRecommendation = skinToneBucket
    ? getMetalRecommendations(skinToneBucket)
    : DEFAULT_METALS;
  if (profile && !profile.skinTone) {
    try {
      const stored = JSON.parse(localStorage.getItem('praxis_style_dna') || '{}');
      if (stored.colorSwatches?.length) colorSwatches = stored.colorSwatches.slice(0, 4);
      if (stored.metalRecommendation) metalRecommendation = stored.metalRecommendation;
    } catch {
      // ignore
    }
  }
  const identity = profile?.styleDNA?.identity_core;
  const showAnalysisCard = identity && (identity.color_season || identity.kibbe || identity.undertone || identity.vertical_line || identity.shoulder);
  const archetype = identity?.kibbe && typeof identity.kibbe === 'object'
    ? (Object.entries(identity.kibbe) as [string, number][]).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? identity.color_season ?? null
    : identity?.color_season ?? null;
  const radarValues = getRadarValuesFromPersonal(identity, profile?.lifestyle || undefined);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8 max-w-2xl">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium text-foreground mb-2">My Style</h1>
              <p className="text-muted-foreground">
                Your personalized style profile
              </p>
            </div>
            {profile && profile.styleDNA && (
              <button
                onClick={() => {
                  navigate('/', { state: { editProfile: true } });
                  window.location.reload(); // Force reload to trigger useEffect
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                Reset Style
              </button>
            )}
          </div>
        </div>

        {!profile || (!profile.styleDNA && !profile.lifestyle && !profile.fitCalibration) ? (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No style profile yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Complete the personal flow to build your Style DNA
            </p>
            <Button onClick={() => navigate('/')} variant="cta">
              Build my style profile
            </Button>
          </div>
        ) : (
          <div className="space-y-8 max-w-2xl mx-auto">
            {/* Header - matching Style DNA report */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
                Your Style DNA
              </h1>
              <p className="text-sm text-muted-foreground">
                This is the framework that consistently works for you.
              </p>
            </div>

            {/* Identity - hero card */}
            {profile.styleDNA && (
              <div className="bg-card rounded-xl border border-border p-6 mb-4 shadow-sm transition-all duration-300 hover:shadow-md">
                <p className="text-xl md:text-2xl text-foreground font-serif italic text-center">
                  &quot;Understated. Refined. Effortless.&quot;
                </p>
              </div>
            )}

            {/* Analysis complete - when we have biometric identity_core */}
            {showAnalysisCard && identity && (
              <div className="bg-card rounded-xl border border-border p-6 mb-4 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Biometric</span>
                </div>
                {archetype && (
                  <p className="text-sm text-foreground font-medium mb-3">
                    Your profile suggests a <span className="capitalize">{archetype}</span> archetype.
                  </p>
                )}
                <ul className="space-y-2">
                  {identity.undertone && (
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Undertone {identity.undertone}</span>
                    </li>
                  )}
                  {identity.vertical_line && (
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Vertical line {identity.vertical_line}</span>
                    </li>
                  )}
                  {identity.shoulder && (
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Shoulder {identity.shoulder}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {profile?.styleDNA?.identity_core && (
              <div className="bg-card rounded-xl border border-border p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Identity</span>
                </div>
                <p className="text-sm text-foreground font-medium mb-2">Current archetype: {archetype ?? '—'}</p>
                <div className="flex justify-center py-2">
                  <StyleDNARadarChart values={radarValues} size={160} className="w-[160px] h-[160px] mx-auto" />
                </div>
              </div>
            )}

            {identity?.color_season && (
              <div className="bg-card rounded-xl border border-border p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your season</span>
                  <span className="text-sm font-medium text-foreground capitalize">{identity.color_season.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Rich, warm, and muted tones that echo your natural contrast.</p>
                <div className="flex flex-wrap gap-2">
                  {colorSwatches.map((s, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border border-border shadow-sm" style={{ backgroundColor: s.hex }} title={s.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Your optimal palette */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Your optimal palette
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Balanced tones that enhance your natural contrast and complexion.
              </p>
              <div className="flex justify-start gap-4 mb-6">
                {colorSwatches.map((swatch, index) => (
                  <div key={index} className="flex flex-col items-center gap-1.5">
                    <div 
                      className="w-12 h-12 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    />
                    <span className="text-xs text-muted-foreground">{swatch.name}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Best metals: <span className="text-foreground">{metalRecommendation}</span>
                </p>
              </div>
            </div>

            {/* Lean into */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Lean into
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Balanced warm and cool tones</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Medium-contrast outfits that feel grounded</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Jewel tones for structure and emphasis</span>
                </li>
              </ul>
            </div>

            {/* Avoid */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Avoid
              </h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-foreground">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>Overly bright neons that overpower</span>
                </li>
                <li className="flex items-start gap-3 text-foreground">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>Very pale shades that flatten contrast</span>
                </li>
              </ul>
            </div>

            {/* Collapsible sections - collapsed by default */}
            {profile.styleDNA && (
              <details className="bg-card rounded-xl border border-border p-4 mb-4">
                <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Style DNA Details
                </summary>
                <div className="mt-4 space-y-3 pl-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Primary Style</p>
                    <p className="text-sm text-foreground capitalize">
                      {profile.styleDNA.primaryStyle?.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  {profile.styleDNA.secondaryStyle && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Secondary Style</p>
                      <p className="text-sm text-foreground capitalize">
                        {profile.styleDNA.secondaryStyle.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Fit Calibration - collapsed */}
            {profile.fitCalibration && (
              <details className="bg-card rounded-xl border border-border p-4 mb-4">
                <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Fit Preferences
                </summary>
                <div className="mt-4 space-y-2 pl-6">
                  {profile.fitCalibration.height && (
                    <div>
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="text-sm text-foreground">
                        {profile.fitCalibration.height} cm
                      </p>
                    </div>
                  )}
                  {profile.fitCalibration.fitPreference && (
                    <div>
                      <p className="text-xs text-muted-foreground">Fit Preference</p>
                      <p className="text-sm text-foreground capitalize">
                        {profile.fitCalibration.fitPreference}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Lifestyle - collapsed */}
            {profile.lifestyle && (
              <details className="bg-card rounded-xl border border-border p-4 mb-4">
                <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Lifestyle
                </summary>
                <div className="mt-4 pl-6">
                  <p className="text-sm text-foreground capitalize">{profile.lifestyle.toLowerCase()}</p>
                </div>
              </details>
            )}

            {/* Closing line */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Style is clarity. You now have yours.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={() => navigate('/history')} variant="outline" className="w-full">
                View Outfit History
              </Button>
              <Button onClick={() => navigate('/settings')} variant="outline" className="w-full">
                Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
