import FlowStep from './FlowStep';
import OptionButton from './OptionButton';
import type { OccasionType } from '@/types/praxis';

interface StepOccasionProps {
  value: OccasionType | '';
  onNext: (event: OccasionType) => void;
  onBack?: () => void;
}

const StepOccasion = ({ value, onNext, onBack }: StepOccasionProps) => {
  const occasionOptions: { value: OccasionType; label: string }[] = [
    { value: 'WEDDING', label: 'Wedding' },
    { value: 'WORK', label: 'Work' },
    { value: 'DINNER', label: 'Dinner' },
    { value: 'DATE', label: 'Date' },
    { value: 'PARTY', label: 'Party' },
  ];

  return (
    <FlowStep title="What's the occasion?" onBack={onBack}>
      <div className="space-y-3">
        {occasionOptions.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => onNext(option.value)}
          />
        ))}
      </div>
    </FlowStep>
  );
};

export default StepOccasion;
