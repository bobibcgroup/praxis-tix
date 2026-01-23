/**
 * AddToHomeScreen Component
 * Main component that orchestrates platform-specific install prompts
 */

import { useAddToHomeScreen } from '@/hooks/useAddToHomeScreen';
import { IOSPrompt } from './AddToHomeScreen/IOSPrompt';
import { AndroidPrompt } from './AddToHomeScreen/AndroidPrompt';
import { DesktopPrompt } from './AddToHomeScreen/DesktopPrompt';

export function AddToHomeScreen() {
  const {
    shouldShowPrompt,
    isInstalled,
    platform,
    showIOSInstructions,
    setShowIOSInstructions,
  } = useAddToHomeScreen();

  // Don't render if already installed or shouldn't show
  if (isInstalled || (!shouldShowPrompt && !showIOSInstructions)) {
    return null;
  }

  // Render platform-specific prompt
  if (platform === 'ios') {
    return (
      <IOSPrompt
        showInstructions={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    );
  }

  if (platform === 'android') {
    return <AndroidPrompt />;
  }

  if (platform === 'desktop') {
    return <DesktopPrompt />;
  }

  return null;
}
