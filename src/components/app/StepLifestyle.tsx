import FlowStep from './FlowStep';
import OptionButton from './OptionButton';
import type { LifestyleType } from '@/types/praxis';

interface StepLifestyleProps {
  value: LifestyleType | '';
  onSelect: (lifestyle: LifestyleType) => void;
  onBack: () => void;
}

const lifestyleOptions: { value: LifestyleType; label: string }[] = [
  { value: 'WORK', label: 'Work focused' },
  { value: 'SOCIAL', label: 'Social and nights out' },
  { value: 'CASUAL', label: 'Casual and relaxed' },
  { value: 'MIXED', label: 'Mixed' },
];

const StepLifestyle = ({ value, onSelect, onBack }: StepLifestyleProps) => {
  return (
    <FlowStep 
      title="Your life is mostly…"
      subtitle="This helps balance your wardrobe."
    >
      <div className="space-y-3">
        {lifestyleOptions.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => {
              onSelect(option.value);
              // Auto-advance on mobile after short delay
              if (window.innerWidth < 768) {
                setTimeout(() => {
                  // Navigation handled by parent via onSelect
                }, 300);
              }
            }}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          Back
        </button>
      </div>
    </FlowStep>
  );
};

export default StepLifestyle;
