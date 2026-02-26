import FlowStep from './FlowStep';
import { Button } from '@/components/ui/button';
import { Scan, Cpu, Sparkles } from 'lucide-react';

interface StepPersonalLoadingProps {
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

const PROCESS_STEPS = [
  { id: 'vision', label: 'Analyzing your photo & biometrics', icon: Scan },
  { id: 'style', label: 'Applying style engine', icon: Cpu },
  { id: 'dna', label: 'Building your Style DNA', icon: Sparkles },
];

const StepPersonalLoading = ({
  isGenerating,
  error,
  onRetry,
  onBack,
}: StepPersonalLoadingProps) => {
  if (error) {
    return (
      <FlowStep title="We're refining your style" subtitle="Please try again.">
        <div className="space-y-4">
          <Button onClick={onRetry} variant="cta" size="lg" className="w-full">
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
      {/* Processing / AI progress card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Processing
          </span>
        </div>
        <ul className="space-y-4">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'backwards' }}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                </div>
                {index === 0 && (
                  <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          This usually takes a few seconds. Feel free to stay on this screen.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      </div>
    </FlowStep>
  );
};

export default StepPersonalLoading;
