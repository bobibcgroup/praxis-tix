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
    <FlowStep title="Let's style your next look.">
      <p className="text-muted-foreground text-center mb-8 -mt-2">
        One-tap outfits, or a style built just for you.
      </p>
      <div className="space-y-3">
        {/* Primary Card - Dominant */}
        <button
          type="button"
          onClick={onSelectQuick}
          className="w-full py-6 px-6 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 text-left transition-all group"
        >
          <span className="block text-lg font-medium text-foreground group-hover:text-foreground mb-1">
            Style a moment
          </span>
          <span className="block text-sm text-muted-foreground mb-4">
            Occasion-based. No setup.
          </span>
          <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            Get an outfit
          </span>
        </button>

        {/* Secondary Card - Quieter */}
        <button
          type="button"
          onClick={handlePersonalClick}
          className="w-full py-5 px-6 rounded-xl border border-border/60 bg-background/50 hover:border-primary/30 hover:bg-muted/20 text-left transition-all group"
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="block text-lg font-medium text-foreground/90 group-hover:text-foreground">
              Build my personal style
            </span>
          </div>
          <span className="block text-sm text-muted-foreground/80 mt-1">
            Smarter recommendations over time.
          </span>
          <span className="inline-block mt-3 px-4 py-1.5 border border-border rounded-lg text-sm text-muted-foreground">
            Sign in to personalize
          </span>
        </button>
      </div>
    </FlowStep>
  );
};

export default StepModeSelect;
