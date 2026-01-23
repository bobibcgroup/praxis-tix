import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Trash2, Mail, User as UserIcon, Moon, Sun, Monitor, AlertCircle } from 'lucide-react';
import { getOutfitHistory, getUserProfile, getFavorites } from '@/lib/userService';
import { migrateLocalStorageToSupabase, hasLocalStorageData } from '@/lib/migrateLocalStorage';
import Header from '@/components/Header';
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
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const Settings = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        navigate('/');
        return;
      }
      // Check for localStorage data
      if (user) {
        setHasLocalData(hasLocalStorageData(user.id));
      }
    }
  }, [user, isLoaded, navigate]);

  const handleExportData = async () => {
    if (!user) return;

    try {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const [history, profile, favorites] = await Promise.all([
        getOutfitHistory(user.id, userEmail),
        getUserProfile(user.id),
        getFavorites(user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
        },
        profile,
        history,
        favorites,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `praxis-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Actual account deletion should be handled by Clerk
    // This is a placeholder for the functionality
    toast.info('Account deletion must be done through your account settings');
    setDeleteDialogOpen(false);
  };

  const handleMigrateLocalStorage = async () => {
    if (!user) return;
    
    setMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase(user.id);
      if (result.migrated > 0) {
        toast.success(`Successfully migrated ${result.migrated} entries to Supabase`);
        setHasLocalData(false);
      }
      if (result.failed > 0) {
        toast.error(`Failed to migrate ${result.failed} entries. Check console for details.`);
      }
    } catch (error) {
      console.error('Error migrating localStorage:', error);
      toast.error('Failed to migrate data. Check console for details.');
    } finally {
      setMigrating(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8 max-w-2xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/profile')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to profile
          </Button>
          <h1 className="text-3xl font-medium text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Choose your preferred theme. Changes apply immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="w-4 h-4" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Account Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Account Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-foreground">{user?.primaryEmailAddress?.emailAddress || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">User ID</p>
                <p className="text-foreground font-mono text-xs break-all">{user?.id || 'Not available'}</p>
              </div>
              {user?.fullName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="text-foreground">{user.fullName}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Account information is managed by Clerk. To update your email or password, use the account menu.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
              <p className="text-xs text-muted-foreground">
                Download all your profile data, outfit history, and favorites as a JSON file.
              </p>
              
              {hasLocalData && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Local Storage Data Found
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                        You have outfit history stored in your browser's local storage. 
                        Migrate it to Supabase to access it across all devices.
                      </p>
                      <Button
                        onClick={handleMigrateLocalStorage}
                        variant="outline"
                        size="sm"
                        disabled={migrating}
                        className="w-full"
                      >
                        {migrating ? 'Migrating...' : 'Migrate to Supabase'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone - Increased spacing and visual isolation */}
          <div className="bg-card rounded-xl border border-destructive/30 p-6 mt-12">
            <h2 className="text-lg font-medium text-foreground mb-6 text-destructive">Danger Zone</h2>
            <div className="space-y-4">
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your account? This will permanently delete all your data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your style profile</li>
                  <li>All outfit history</li>
                  <li>All favorites</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Settings;
