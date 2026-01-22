import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { HeightUnit, FitPreference } from '@/types/praxis';

interface StepFitCalibrationProps {
  onComplete: (data: { height?: number; heightUnit: HeightUnit; fitPreference?: FitPreference }) => void;
  onSkip: () => void;
  onBack: () => void;
}

const FIT_OPTIONS: { value: FitPreference; label: string }[] = [
  { value: 'slim', label: 'Slim' },
  { value: 'regular', label: 'Regular' },
  { value: 'relaxed', label: 'Relaxed' },
];

const StepFitCalibration = ({ onComplete, onSkip, onBack }: StepFitCalibrationProps) => {
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState<string>('');
  const [heightFt, setHeightFt] = useState<string>('');
  const [heightIn, setHeightIn] = useState<string>('');
  const [fitPreference, setFitPreference] = useState<FitPreference | null>(null);

  // Convert to cm for storage
  const getHeightInCm = (): number | undefined => {
    if (heightUnit === 'cm') {
      const cm = parseFloat(heightCm);
      return isNaN(cm) || cm <= 0 ? undefined : cm;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      if (ft <= 0 && inches <= 0) return undefined;
      return Math.round((ft * 30.48) + (inches * 2.54));
    }
  };

  const handleContinue = () => {
    onComplete({
      height: getHeightInCm(),
      heightUnit,
      fitPreference: fitPreference || undefined,
    });
  };

  const hasAnyInput = getHeightInCm() !== undefined || fitPreference !== null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-medium text-foreground mb-2">
          Quick fit calibration
        </h1>
        <p className="text-sm text-muted-foreground">
          This helps us get lengths and proportions right.
        </p>
      </div>

      {/* Height Input */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">
            Height
          </label>
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setHeightUnit('cm')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                heightUnit === 'cm'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              cm
            </button>
            <button
              onClick={() => setHeightUnit('ft-in')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                heightUnit === 'ft-in'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ft + in
            </button>
          </div>
        </div>

        {heightUnit === 'cm' ? (
          <div className="relative">
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175"
              min="100"
              max="250"
              className="w-full px-4 py-3 pr-12 text-lg bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              cm
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                placeholder="5"
                min="3"
                max="8"
                className="w-full px-4 py-3 pr-10 text-lg bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ft
              </span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                placeholder="10"
                min="0"
                max="11"
                className="w-full px-4 py-3 pr-10 text-lg bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                in
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fit Preference */}
      <div className="mb-10">
        <label className="text-sm font-medium text-foreground block mb-3">
          Fit preference
        </label>
        <div className="flex gap-3">
          {FIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFitPreference(option.value)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                fitPreference === option.value
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        {hasAnyInput ? (
          <Button
            onClick={handleContinue}
            variant="cta"
            size="lg"
            className="w-full"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={onSkip}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Skip
          </Button>
        )}
        {hasAnyInput && (
          <button
            onClick={onSkip}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default StepFitCalibration;
