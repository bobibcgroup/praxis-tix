import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Palette, Ruler, Heart, Edit2 } from 'lucide-react';
import { getUserProfile } from '@/lib/userService';
import type { PersonalData } from '@/types/praxis';
import Header from '@/components/Header';
import { getRecommendedSwatches, getMetalRecommendations } from '@/lib/personalOutfitGenerator';

const Profile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PersonalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        navigate('/');
        return;
      }

      loadProfile();
    }
  }, [user, isLoaded]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserProfile(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const colorSwatches = profile?.skinTone?.bucket
    ? getRecommendedSwatches(profile.skinTone.bucket).slice(0, 4)
    : [];

  const metalRecommendation = profile?.skinTone?.bucket
    ? getMetalRecommendations(profile.skinTone.bucket)
    : 'Silver, Gold, Rose Gold';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
              <Button
                onClick={() => {
                  navigate('/', { state: { editProfile: true } });
                  window.location.reload(); // Force reload to trigger useEffect
                }}
                variant="outline"
                size="sm"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {!profile || !profile.styleDNA ? (
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
          <div className="space-y-6">
            {/* Style DNA */}
            {profile.styleDNA && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Style DNA
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Primary Style</p>
                    <p className="text-foreground capitalize">
                      {profile.styleDNA.primaryStyle?.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  {profile.styleDNA.secondaryStyle && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Secondary Style</p>
                      <p className="text-foreground capitalize">
                        {profile.styleDNA.secondaryStyle.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Color Palette */}
            {colorSwatches.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Optimal Palette
                </h2>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {colorSwatches.map((swatch, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="w-full aspect-square rounded-lg mb-2 border border-border"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <p className="text-xs text-muted-foreground">{swatch.name}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Best Metals</p>
                  <p className="text-foreground">{metalRecommendation}</p>
                </div>
              </div>
            )}

            {/* Fit Calibration */}
            {profile.fitCalibration && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Fit Preferences
                </h2>
                <div className="space-y-2">
                  {profile.fitCalibration.height && (
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="text-foreground">
                        {profile.fitCalibration.height} cm
                      </p>
                    </div>
                  )}
                  {profile.fitCalibration.fitPreference && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fit Preference</p>
                      <p className="text-foreground capitalize">
                        {profile.fitCalibration.fitPreference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lifestyle */}
            {profile.lifestyle && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Lifestyle
                </h2>
                <p className="text-foreground capitalize">{profile.lifestyle.toLowerCase()}</p>
              </div>
            )}

            <div className="pt-4">
              <Button onClick={() => navigate('/history')} variant="outline" className="w-full">
                View Outfit History
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
