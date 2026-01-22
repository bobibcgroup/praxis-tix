interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i <= currentStep 
              ? 'w-6 bg-primary' 
              : 'w-4 bg-border'
          }`}
        />
      ))}
    </div>
  );
};

export default ProgressIndicator;
