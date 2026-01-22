import { Button } from '@/components/ui/button';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { User } from 'lucide-react';
import FlowStep from './FlowStep';

interface StepCompleteProps {
  onRestart: () => void;
  showUpsell?: boolean;
  onStartPersonal?: () => void;
}

const StepComplete = ({ onRestart, showUpsell, onStartPersonal }: StepCompleteProps) => {
  const { user, isLoaded } = useUser();
  return (
    <FlowStep title="This is the right choice.">
      <div className="space-y-8">
        <p className="text-muted-foreground text-center">
          Every detail is intentional.
        </p>

        {showUpsell && onStartPersonal && (
          <div className="space-y-8">
            {/* Sign-in prompt */}
            {isLoaded && !user && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground mb-2">
                      Sign in to save your outfits and build your style profile
                    </p>
                    <SignInButton mode="modal">
                      <Button variant="outline" size="sm">
                        Sign in
                      </Button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={onStartPersonal}
                variant="cta"
                size="lg"
                className="w-full"
              >
                Build my style profile
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                One-time setup. Better results every time.
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={onRestart}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Style another moment
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">
                For a quick, occasion-based recommendation.
              </p>
            </div>
          </div>
        )}

        {!showUpsell && (
          <Button 
            onClick={onRestart}
            variant="cta"
            size="lg"
            className="w-full"
          >
            Style another moment
          </Button>
        )}
      </div>
    </FlowStep>
  );
};

export default StepComplete;
