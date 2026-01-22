import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface FlowStepProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

const FlowStep = ({ children, title, subtitle, onBack }: FlowStepProps) => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center px-4">
      <div className="max-w-md mx-auto w-full">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-base">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default FlowStep;
