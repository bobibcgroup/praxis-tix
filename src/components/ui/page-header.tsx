import { ReactNode } from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
}

export const PageHeader = ({ 
  title, 
  subtitle, 
  backTo, 
  backLabel = 'Back',
  action 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      {backTo && (
        <Button
          onClick={() => navigate(backTo)}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium text-foreground mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};
