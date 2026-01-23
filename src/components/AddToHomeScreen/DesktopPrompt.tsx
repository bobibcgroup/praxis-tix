/**
 * Desktop Install Prompt Component
 * Shows install prompt for Desktop Chrome/Edge
 */

import { X, Download, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';
import { cn } from '@/lib/utils';

export function DesktopPrompt() {
  const { handleInstall, handleDismiss, handlePostpone } = useAddToHomeScreen();

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'bg-card border border-border rounded-lg shadow-lg',
        'animate-in slide-in-from-top-2 fade-in-0 duration-300',
        'max-w-sm w-full sm:w-auto'
      )}
      role="dialog"
      aria-labelledby="desktop-prompt-title"
      aria-describedby="desktop-prompt-description"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              id="desktop-prompt-title"
              className="text-sm font-semibold text-foreground mb-1"
            >
              Install Praxis
            </h3>
            <p
              id="desktop-prompt-description"
              className="text-xs text-muted-foreground mb-3"
            >
              Install Praxis as an app for quick access and offline use
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 text-xs h-8"
                aria-label="Install Praxis application"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Install
              </Button>
              <Button
                onClick={handlePostpone}
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2"
                aria-label="Postpone installation"
              >
                Later
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 -mt-1 -mr-1"
            aria-label="Dismiss installation prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
