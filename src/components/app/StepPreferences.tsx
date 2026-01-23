import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';
import type { PreferencesData, PriorityType, BudgetType } from '@/types/praxis';

interface StepPreferencesProps {
  data: PreferencesData;
  onUpdate: (data: PreferencesData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const StepPreferences = ({ data, onUpdate, onSubmit, onBack }: StepPreferencesProps) => {
  const handleChange = <K extends keyof PreferencesData>(field: K, value: PreferencesData[K]) => {
    onUpdate({ ...data, [field]: value });
  };

  const priorityOptions: { value: PriorityType; label: string; helper: string }[] = [
    { value: 'SIMPLE', label: 'Safe & clean', helper: 'Hard to get wrong' },
    { value: 'SHARP', label: 'Sharp & confident', helper: 'A bit more polished' },
    { value: 'COMFORT', label: 'Relaxed & easy', helper: 'Comfort first' },
  ];

  const budgetOptions: { value: BudgetType; label: string; helper: string }[] = [
    { value: 'EVERYDAY', label: 'Considered', helper: 'Smart choices. Strong value.' },
    { value: 'MID_RANGE', label: 'Elevated', helper: 'Better fabrics. Better fit.' },
    { value: 'PREMIUM', label: 'Unrestricted', helper: 'Only the right result matters.' },
  ];

  const canSubmit = data.priority && data.budget;

  return (
    <FlowStep title="Your priorities">
      <div className="space-y-6 pb-20">
        {/* Priority / Vibe */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">What kind of vibe do you want today?</label>
          <p className="text-xs text-muted-foreground mb-3">Pick what matters most.</p>
          <div className="grid grid-cols-1 gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange('priority', option.value)}
                className={`px-4 py-4 rounded-lg border-2 text-left transition-all min-h-[56px] flex items-center
                  ${data.priority === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-background hover:border-muted-foreground/30'
                  }`}
              >
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground/70 ml-2">{option.helper}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget / Intentionality */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">How do you want to invest in this look?</label>
          <p className="text-xs text-muted-foreground mb-3">Pick what matters most.</p>
          <div className="grid grid-cols-1 gap-2">
            {budgetOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange('budget', option.value)}
                className={`px-4 py-4 rounded-lg border-2 text-left transition-all min-h-[56px] flex items-center
                  ${data.budget === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-background hover:border-muted-foreground/30'
                  }`}
              >
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground/70 ml-2">{option.helper}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 md:relative md:border-t-0 md:p-0 md:pt-2">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="lg" 
            className="flex-1 text-muted-foreground"
          >
            Back
          </Button>
          <Button 
            onClick={onSubmit} 
            variant="cta" 
            size="lg" 
            className="flex-[2]"
            disabled={!canSubmit}
          >
            Show my looks
          </Button>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepPreferences;
