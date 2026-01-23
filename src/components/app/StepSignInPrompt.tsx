import { Button } from '@/components/ui/button';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { User } from 'lucide-react';
import FlowStep from './FlowStep';

interface StepSignInPromptProps {
  onSignInComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const StepSignInPrompt = ({ onSignInComplete, onBack, onSkip }: StepSignInPromptProps) => {
  const { user, isLoaded } = useUser();

  // If user signs in, automatically continue
  if (isLoaded && user) {
    // Small delay to ensure state is updated
    setTimeout(() => {
      onSignInComplete();
    }, 100);
    return null;
  }

  return (
    <FlowStep 
      title="Sign in to continue"
      subtitle="Save your style profile and access your personalized recommendations."
      onBack={onBack}
    >
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Sign in to build your personal style
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Your style profile will be saved and you'll be able to access your outfit history, favorites, and personalized recommendations across all devices.
              </p>
              <SignInButton mode="modal">
                <Button variant="cta" size="sm" className="w-full">
                  Sign in to continue
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>

        {onSkip && (
          <Button onClick={onSkip} variant="outline" size="lg" className="w-full">
            Continue without signing in
          </Button>
        )}
      </div>
    </FlowStep>
  );
};

export default StepSignInPrompt;
