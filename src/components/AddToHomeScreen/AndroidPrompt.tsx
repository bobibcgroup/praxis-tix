/**
 * Android Install Prompt Component
 * Shows install prompt for Android Chrome/Edge
 */

import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';
import { cn } from '@/lib/utils';

export function AndroidPrompt() {
  const { handleInstall, handleDismiss, handlePostpone } = useAddToHomeScreen();

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card border-t border-border shadow-lg',
        'animate-in slide-in-from-bottom-4 duration-300',
        'safe-area-inset-bottom'
      )}
      role="dialog"
      aria-labelledby="android-prompt-title"
      aria-describedby="android-prompt-description"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              id="android-prompt-title"
              className="text-base font-semibold text-foreground mb-1"
            >
              Install Praxis
            </h3>
            <p
              id="android-prompt-description"
              className="text-sm text-muted-foreground mb-3"
            >
              Get quick access and work offline. Install now for a better experience.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
                aria-label="Install Praxis application"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Install
              </Button>
              <Button
                onClick={handlePostpone}
                variant="outline"
                size="sm"
                className="flex-1"
                aria-label="Postpone installation"
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
  );
}
