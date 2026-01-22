import FlowStep from './FlowStep';
import { Button } from '@/components/ui/button';

interface StepPersonalLoadingProps {
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

const StepPersonalLoading = ({ 
  isGenerating, 
  error, 
  onRetry, 
  onBack 
}: StepPersonalLoadingProps) => {
  if (error) {
    return (
      <FlowStep 
        title="We're refining your style"
        subtitle="Please try again."
      >
        <div className="space-y-4">
          <Button
            onClick={onRetry}
            variant="cta"
            size="lg"
            className="w-full"
          >
            Try again
          </Button>
          <button
            onClick={onBack}
            className="w-full py-3 text-center text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Go back
          </button>
        </div>
      </FlowStep>
    );
  }

  return (
    <FlowStep 
      title="Styling you…"
      subtitle="Finding the best options for your style."
    >
      <div className="flex justify-center py-8">
        <div className="relative">
          {/* Subtle pulsing animation */}
          <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 animate-ping" />
          </div>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepPersonalLoading;
