import { Button } from '@/components/ui/button';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { User, Mail, Calendar } from 'lucide-react';
import { useState } from 'react';
import FlowStep from './FlowStep';

interface StepCompleteProps {
  onRestart: () => void;
  showUpsell?: boolean;
  onStartPersonal?: () => void;
  /** Optional: share URL for "Email my looks" / "Add to calendar" */
  shareUrl?: string;
  occasion?: string;
  eventDate?: string;
  lookName?: string;
}

const StepComplete = ({ onRestart, showUpsell, onStartPersonal, shareUrl, occasion, eventDate, lookName }: StepCompleteProps) => {
  const { user, isLoaded } = useUser();
  const [linkCopied, setLinkCopied] = useState(false);

  const handleEmailSummary = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    const title = lookName ? `Praxis: ${lookName}` : occasion ? `Praxis look: ${occasion}` : 'Praxis look';
    const start = eventDate ? new Date(eventDate + 'T09:00:00') : new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTEND:${end.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `SUMMARY:${title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${shareUrl.replace(/,/g, '\\,')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'praxis-look.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <FlowStep title="This is the right choice.">
      <div className="space-y-8">
        <p className="text-muted-foreground text-center">
          Every detail is intentional.
        </p>

        {showUpsell && onStartPersonal && (
          <div className="space-y-8">
            {/* Sign-in prompt */}
            {isLoaded && !user && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground mb-2">
                      Sign in to save your outfits and build your style profile
                    </p>
                    <SignInButton mode="modal">
                      <Button variant="outline" size="sm">
                        Sign in
                      </Button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {isLoaded && user ? (
                <>
                  <Button 
                    onClick={onStartPersonal}
                    variant="cta"
                    size="lg"
                    className="w-full"
                  >
                    Build my style profile
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    One-time setup. Better results every time.
                  </p>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button 
                      variant="cta"
                      size="lg"
                      className="w-full"
                    >
                      Sign in to build your style profile
                    </Button>
                  </SignInButton>
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in required to build your personalized style profile
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={onRestart}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Plan next look
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">
                Style another moment — quick, occasion-based recommendation.
              </p>
              {shareUrl && (
                <div className="pt-2 space-y-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleEmailSummary}>
                    <Mail className="w-4 h-4" />
                    {linkCopied ? 'Link copied — paste in email' : 'Email my looks'}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleAddToCalendar}>
                    <Calendar className="w-4 h-4" />
                    Add to calendar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {!showUpsell && (
          <div className="space-y-2">
            <Button 
              onClick={onRestart}
              variant="cta"
              size="lg"
              className="w-full"
            >
              Plan next look
            </Button>
            {shareUrl && (
              <div className="pt-2 space-y-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleEmailSummary}>
                  <Mail className="w-4 h-4" />
                  {linkCopied ? 'Link copied' : 'Email my looks'}
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleAddToCalendar}>
                  <Calendar className="w-4 h-4" />
                  Add to calendar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </FlowStep>
  );
};

export default StepComplete;
