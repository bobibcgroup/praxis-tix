import FlowStep from './FlowStep';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepModeSelectProps {
  onSelectQuick: () => void;
  onSelectPersonal: () => void;
}

const StepModeSelect = ({ onSelectQuick, onSelectPersonal }: StepModeSelectProps) => {
  const { user, isLoaded } = useUser();

  const handlePersonalClick = () => {
    // Allow starting personal flow without auth - sign-in prompt will appear at photo step
    onSelectPersonal();
  };

  return (
    <FlowStep title="What do you want to do today?">
      <p className="text-muted-foreground text-center mb-6 -mt-2">
        Choose how you want Praxis to work for you.
      </p>
      <div className="text-xs text-muted-foreground/70 text-center mb-4 space-y-1">
        <p>Quick recommendations based on occasion, or</p>
        <p>Personalized style built around your profile</p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSelectQuick}
          className="w-full py-5 px-6 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-left transition-all group"
        >
          <span className="block text-lg font-medium text-foreground group-hover:text-foreground">
            Style a moment
          </span>
          <span className="block text-sm text-muted-foreground mt-1">
            Decisive & occasion-based
          </span>
        </button>

        <button
          type="button"
          onClick={handlePersonalClick}
          className="w-full py-5 px-6 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-left transition-all group"
        >
          <span className="block text-lg font-medium text-foreground group-hover:text-foreground">
            Build my personal style
          </span>
          <span className="block text-sm text-muted-foreground mt-1">
            Personalized, precise, built around you
          </span>
        </button>
      </div>
    </FlowStep>
  );
};

export default StepModeSelect;
