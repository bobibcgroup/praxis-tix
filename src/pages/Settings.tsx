import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { getOutfitHistory, getUserProfile, getFavorites } from '@/lib/userService';
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

const Settings = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        navigate('/');
        return;
      }
    }
  }, [user, isLoaded, navigate]);

  const handleExportData = async () => {
    if (!user) return;

    try {
      const [history, profile, favorites] = await Promise.all([
        getOutfitHistory(user.id),
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-medium text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Account Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-foreground">{user?.primaryEmailAddress?.emailAddress || 'Not available'}</p>
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
            <h2 className="text-xl font-medium text-foreground mb-4">Data Management</h2>
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
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-xl border border-destructive/20 p-6">
            <h2 className="text-xl font-medium text-foreground mb-4 text-destructive">Danger Zone</h2>
            <div className="space-y-3">
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
