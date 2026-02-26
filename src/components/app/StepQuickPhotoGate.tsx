import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';

interface StepQuickPhotoGateProps {
  onAddPhotos: () => void;
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Flow 1 (Style a moment): after intent capture, before results.
 * "I can recommend now, but 2 quick photos will make this accurate for your body lines and coloring."
 */
const StepQuickPhotoGate = ({ onAddPhotos, onSkip, onBack }: StepQuickPhotoGateProps) => {
  return (
    <FlowStep title="Got it." onBack={onBack}>
      <p className="text-muted-foreground text-center mb-6">
        I can recommend now, but 2 quick photos will make this accurate for your body lines and coloring.
      </p>
      <div className="flex flex-col gap-3">
        <Button
          variant="cta"
          size="lg"
          className="w-full"
          onClick={onAddPhotos}
        >
          Add photos for precision
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full text-muted-foreground"
          onClick={onSkip}
        >
          Skip (lower accuracy)
        </Button>
      </div>
    </FlowStep>
  );
};

export default StepQuickPhotoGate;
