import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StyleNameModalProps {
  open: boolean;
  onConfirm: (styleName: string) => void;
  onCancel: () => void;
  required?: boolean; // If true, user cannot skip/cancel
}

const StyleNameModal = ({ open, onConfirm, onCancel, required = false }: StyleNameModalProps) => {
  const [styleName, setStyleName] = useState('');

  const handleConfirm = () => {
    if (styleName.trim()) {
      onConfirm(styleName.trim());
      setStyleName('');
    }
  };

  const handleCancel = () => {
    if (!required) {
      setStyleName('');
      onCancel();
    }
    // If required, do nothing - user must provide a name
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name Your Style</DialogTitle>
          <DialogDescription>
            Give your style a name so you can easily find it later. This will help you track your style evolution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="style-name">Style Name</Label>
            <Input
              id="style-name"
              placeholder="e.g., Summer Work Look, Date Night Style"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && styleName.trim()) {
                  handleConfirm();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          {!required && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleConfirm} disabled={!styleName.trim()}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StyleNameModal;
