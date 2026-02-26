import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';

type FeedbackChoice = 'first' | 'second' | 'third' | 'none';

interface StepFeedbackProps {
  onDone: () => void;
}

const StepFeedback = ({ onDone }: StepFeedbackProps) => {
  const [selected, setSelected] = useState<FeedbackChoice | null>(null);

  const handleSelect = (choice: FeedbackChoice) => {
    setSelected(choice);
    // Store in localStorage
    const feedback = {
      choice,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('praxis_feedback', JSON.stringify(feedback));
  };

  const options: { value: FeedbackChoice; label: string }[] = [
    { value: 'first', label: 'First' },
    { value: 'second', label: 'Second' },
    { value: 'third', label: 'Third' },
    { value: 'none', label: 'None' },
  ];

  return (
    <FlowStep title="Which option felt closest to you?">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-4 py-4 rounded-lg border-2 text-sm font-medium transition-all
                ${selected === option.value 
                  ? 'border-primary bg-primary/5 text-foreground' 
                  : 'border-border bg-background hover:border-muted-foreground/30 text-foreground'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          This helps us understand what works.
        </p>

        <Button 
          onClick={onDone}
          variant="cta"
          size="lg"
          className="w-full"
          disabled={!selected}
        >
          Done
        </Button>
      </div>
    </FlowStep>
  );
};

export default StepFeedback;
