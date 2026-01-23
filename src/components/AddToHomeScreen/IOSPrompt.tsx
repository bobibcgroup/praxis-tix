/**
 * iOS Install Prompt Component
 * Shows manual instructions for adding to home screen on iOS Safari
 */

import { X, Share2, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';
import { cn } from '@/lib/utils';

interface IOSPromptProps {
  showInstructions: boolean;
  onClose: () => void;
}

export function IOSPrompt({ showInstructions, onClose }: IOSPromptProps) {
  const { handleDismiss, handlePostpone, setShowIOSInstructions } = useAddToHomeScreen();

  return (
    <>
      {/* Bottom Banner Prompt */}
      {!showInstructions && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-card border-t border-border shadow-lg',
            'animate-in slide-in-from-bottom-4 duration-300',
            'safe-area-inset-bottom'
          )}
          role="dialog"
          aria-labelledby="ios-prompt-title"
          aria-describedby="ios-prompt-description"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-start gap-4">
              {/* App Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">👔</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  id="ios-prompt-title"
                  className="text-base font-semibold text-foreground mb-1"
                >
                  Install Praxis
                </h3>
                <p
                  id="ios-prompt-description"
                  className="text-sm text-muted-foreground mb-3"
                >
                  Get quick access to your outfits from your home screen
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowIOSInstructions(true)}
                    size="sm"
                    className="flex-1"
                  >
                    Install
                  </Button>
                  <Button
                    onClick={handlePostpone}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1"
                aria-label="Dismiss installation prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Praxis to Home Screen</DialogTitle>
            <DialogDescription>
              Follow these steps to install Praxis on your iPhone or iPad
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  1
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Tap the Share button
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm">
                    Look for the Share icon at the bottom of Safari
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  2
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Scroll down and tap "Add to Home Screen"
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PlusSquare className="h-4 w-4" />
                  <span className="text-sm">
                    You'll find this option in the share menu
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  3
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Tap "Add" to confirm
                </p>
                <p className="text-sm text-muted-foreground">
                  Praxis will appear on your home screen like a native app
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} className="flex-1" variant="outline">
              Got It
            </Button>
            <Button
              onClick={() => {
                handleDismiss(true);
                onClose();
              }}
              variant="ghost"
              className="flex-1"
            >
              Don't Show Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
