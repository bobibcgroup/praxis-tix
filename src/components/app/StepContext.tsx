import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import FlowStep from './FlowStep';
import type { ContextData, LocationType, TimeType, SettingType, OccasionType } from '@/types/praxis';

interface StepContextProps {
  data: ContextData;
  occasion: OccasionType;
  onUpdate: (data: ContextData) => void;
  onNext: () => void;
  onBack: () => void;
}

// ============= SETTING INFERENCE RULES =============
// Setting is automatically derived from Location - no contradictions possible
const locationToSetting: Record<LocationType, SettingType> = {
  RESTAURANT: 'INDOOR',
  OFFICE: 'INDOOR',
  HOTEL: 'INDOOR',
  OUTDOOR_VENUE: 'OUTDOOR',
  HOME: 'INDOOR',
  BAR: 'INDOOR',
  CLUB: 'INDOOR',
  MEETING: 'INDOOR',
  CONFERENCE: 'INDOOR',
  BEACH_RESORT: 'OUTDOOR',
  GARDEN: 'OUTDOOR',
  PRIVATE_ESTATE: 'BOTH',
};

// ============= OCCASION → LOCATION MAPPING =============
// Only show relevant locations for each occasion
const occasionToLocations: Record<OccasionType, LocationType[]> = {
  WEDDING: ['HOTEL', 'OUTDOOR_VENUE', 'BEACH_RESORT', 'GARDEN', 'PRIVATE_ESTATE'],
  WORK: ['OFFICE', 'HOTEL', 'RESTAURANT'],
  DATE: ['RESTAURANT', 'BAR', 'OUTDOOR_VENUE', 'HOME'],
  DINNER: ['RESTAURANT', 'HOME', 'HOTEL'],
  PARTY: ['BAR', 'OUTDOOR_VENUE', 'HOME', 'HOTEL'],
};

const locationLabels: Record<LocationType, string> = {
  RESTAURANT: 'Restaurant',
  OFFICE: 'Office',
  HOTEL: 'Hotel',
  OUTDOOR_VENUE: 'Outdoor venue',
  HOME: 'Home',
  BAR: 'Bar',
  CLUB: 'Club',
  MEETING: 'Meeting',
  CONFERENCE: 'Conference',
  BEACH_RESORT: 'Beach resort',
  GARDEN: 'Garden',
  PRIVATE_ESTATE: 'Private estate',
};

const StepContext = ({ data, occasion, onUpdate, onNext, onBack }: StepContextProps) => {
  // Get filtered location options based on occasion
  const locationOptions = useMemo(() => {
    const allowedLocations = occasionToLocations[occasion] || [];
    return allowedLocations.map(loc => ({
      value: loc,
      label: locationLabels[loc],
    }));
  }, [occasion]);

  // Check if time should be auto-set (DINNER = NIGHT)
  const shouldAutoSetTime = occasion === 'DINNER';
  const autoTimeValue: TimeType = 'NIGHT';

  // Reset location if it's no longer valid for this occasion
  // Also auto-set time for DINNER
  useEffect(() => {
    const allowedLocations = occasionToLocations[occasion] || [];
    const updates: Partial<ContextData> = {};
    
    if (data.location && !allowedLocations.includes(data.location)) {
      updates.location = '';
      updates.setting = '';
    }
    
    // Auto-set time for DINNER
    if (shouldAutoSetTime && data.when !== autoTimeValue) {
      updates.when = autoTimeValue;
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdate({ ...data, ...updates });
    }
  }, [occasion]);

  // Auto-infer setting when location changes
  useEffect(() => {
    if (data.location) {
      const inferredSetting = locationToSetting[data.location];
      if (data.setting !== inferredSetting) {
        onUpdate({ ...data, setting: inferredSetting });
      }
    }
  }, [data.location]);

  const handleLocationChange = (location: LocationType) => {
    // Set location and auto-infer setting in one update
    const inferredSetting = locationToSetting[location];
    onUpdate({ ...data, location, setting: inferredSetting });
  };

  const handleTimeChange = (when: TimeType) => {
    onUpdate({ ...data, when });
  };

  const timeOptions: { value: TimeType; label: string }[] = [
    { value: 'DAY', label: 'Day' },
    { value: 'NIGHT', label: 'Night' },
  ];

  // Only location and time are required - setting is inferred
  // For DINNER, time is auto-set so only location is needed from user
  const canContinue = data.location && data.when;

  // Auto-select Day as default if not set
  useEffect(() => {
    if (!shouldAutoSetTime && !data.when) {
      onUpdate({ ...data, when: 'DAY' });
    }
  }, [shouldAutoSetTime, data.when]);

  return (
    <FlowStep title="Set the context">
      <div className="space-y-6">
        {/* Location - filtered by occasion */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">Location</label>
          <div className="grid grid-cols-2 gap-2">
            {locationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleLocationChange(option.value)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  ${data.location === option.value 
                    ? 'border-primary bg-primary/5 text-foreground' 
                    : 'border-border bg-background hover:border-primary/50 hover:bg-muted/30 text-foreground'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time - hidden for DINNER (auto-set to NIGHT) */}
        {!shouldAutoSetTime && (
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">Time of day</label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeChange(option.value)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 min-h-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${data.when === option.value 
                      ? 'border-primary bg-primary/5 text-foreground' 
                      : 'border-border bg-background hover:border-primary/50 hover:bg-muted/30 text-foreground'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="lg" 
            className="flex-1 text-muted-foreground"
          >
            Back
          </Button>
          <Button 
            onClick={onNext} 
            variant="cta" 
            size="lg" 
            className="flex-[2]"
            disabled={!canContinue}
          >
            Next
          </Button>
        </div>
      </div>
    </FlowStep>
  );
};

export default StepContext;
