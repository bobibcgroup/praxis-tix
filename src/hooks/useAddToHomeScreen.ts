/**
 * useAddToHomeScreen Hook
 * Manages PWA installation state, timing logic, and user preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPlatformInfo, supportsInstallPrompt, type Platform } from '@/utils/pwaHelper';

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptState {
  visitCount: number;
  timeSpent: number; // in seconds
  lastDismissed: number | null; // timestamp
  permanentlyDismissed: boolean;
  installed: boolean;
  lastShown: number | null; // timestamp
}

const STORAGE_KEY = 'praxis_a2hs_state';
const MIN_VISITS = 2;
const MIN_TIME_SPENT = 30; // seconds
const DISMISSAL_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SHOW_DELAY = 3000; // 3 seconds after page load

/**
 * Load install prompt state from localStorage
 */
function loadState(): InstallPromptState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('[A2HS] Failed to load state:', err);
  }

  return {
    visitCount: 0,
    timeSpent: 0,
    lastDismissed: null,
    permanentlyDismissed: false,
    installed: false,
    lastShown: null,
  };
}

/**
 * Save install prompt state to localStorage
 */
function saveState(state: InstallPromptState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[A2HS] Failed to save state:', err);
  }
}

export interface UseAddToHomeScreenReturn {
  // State
  isInstallable: boolean;
  isInstalled: boolean;
  shouldShowPrompt: boolean;
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;

  // Installation
  installPrompt: InstallPromptEvent | null;
  handleInstall: () => Promise<void>;
  handleDismiss: (permanent?: boolean) => void;
  handlePostpone: () => void;

  // Manual iOS instructions
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
}

export function useAddToHomeScreen(): UseAddToHomeScreenReturn {
  const [state, setState] = useState<InstallPromptState>(loadState);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [pageLoadTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const visitCountIncremented = useRef(false);

  const platformInfo = getPlatformInfo();

  // Track time spent on page
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pageLoadTime) / 1000);
      setTimeSpent(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [pageLoadTime]);

  // Listen for beforeinstallprompt event (Android/Desktop Chrome/Edge)
  useEffect(() => {
    if (!supportsInstallPrompt()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as InstallPromptEvent;
      setInstallPrompt(promptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for app installed event
  useEffect(() => {
    const handleAppInstalled = () => {
      setState((prev) => {
        const newState = { ...prev, installed: true };
        saveState(newState);
        return newState;
      });
      setInstallPrompt(null);
      setShouldShow(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Determine if prompt should be shown
  useEffect(() => {
    // Don't show if already installed
    if (platformInfo.isStandalone || state.installed) {
      setShouldShow(false);
      return;
    }

    // Don't show if permanently dismissed
    if (state.permanentlyDismissed) {
      setShouldShow(false);
      return;
    }

    // Don't show if not installable
    if (!platformInfo.isInstallable) {
      setShouldShow(false);
      return;
    }

    // Check cooldown period
    if (state.lastDismissed) {
      const timeSinceDismissal = Date.now() - state.lastDismissed;
      if (timeSinceDismissal < DISMISSAL_COOLDOWN) {
        setShouldShow(false);
        return;
      }
    }

    // Check if we've shown recently (within last hour)
    if (state.lastShown) {
      const timeSinceShown = Date.now() - state.lastShown;
      if (timeSinceShown < 60 * 60 * 1000) {
        setShouldShow(false);
        return;
      }
    }

    // Increment visit count only once per page load
    if (!visitCountIncremented.current) {
      visitCountIncremented.current = true;
      setState((prev) => {
        const newState = {
          ...prev,
          visitCount: prev.visitCount + 1,
        };
        saveState(newState);
        return newState;
      });
    }

    // Calculate total time spent (current session + previous sessions)
    const totalTimeSpent = state.timeSpent + timeSpent;

    // Show prompt if conditions are met
    const meetsVisitRequirement = state.visitCount >= MIN_VISITS;
    const meetsTimeRequirement = totalTimeSpent >= MIN_TIME_SPENT;
    const hasPrompt = platformInfo.platform === 'ios' || installPrompt !== null;

    if (meetsVisitRequirement && meetsTimeRequirement && hasPrompt) {
      // Delay showing prompt
      const timer = setTimeout(() => {
        setShouldShow(true);
        setState((prev) => {
          const newState = { 
            ...prev, 
            lastShown: Date.now(),
            timeSpent: totalTimeSpent, // Save accumulated time
          };
          saveState(newState);
          return newState;
        });
      }, SHOW_DELAY);

      return () => clearTimeout(timer);
    }

    setShouldShow(false);
  }, [
    platformInfo.isStandalone,
    platformInfo.isInstallable,
    platformInfo.platform,
    state.installed,
    state.permanentlyDismissed,
    state.lastDismissed,
    state.lastShown,
    state.visitCount,
    state.timeSpent,
    installPrompt,
    timeSpent,
  ]);

  // Handle installation
  const handleInstall = useCallback(async () => {
    if (platformInfo.platform === 'ios') {
      // iOS doesn't support programmatic installation
      setShowIOSInstructions(true);
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          setState((prev) => {
            const newState = { ...prev, installed: true };
            saveState(newState);
            return newState;
          });
        }

        setInstallPrompt(null);
        setShouldShow(false);
      } catch (err) {
        console.error('[A2HS] Installation failed:', err);
      }
    }
  }, [installPrompt, platformInfo.platform]);

  // Handle dismissal
  const handleDismiss = useCallback(
    (permanent = false) => {
      setShouldShow(false);
      setShowIOSInstructions(false);

      setState((prev) => {
        const newState = {
          ...prev,
          lastDismissed: Date.now(),
          permanentlyDismissed: permanent || prev.permanentlyDismissed,
        };
        saveState(newState);
        return newState;
      });
    },
    []
  );

  // Handle postpone
  const handlePostpone = useCallback(() => {
    handleDismiss(false);
  }, [handleDismiss]);

  return {
    isInstallable: platformInfo.isInstallable && !platformInfo.isStandalone,
    isInstalled: platformInfo.isStandalone || state.installed,
    shouldShowPrompt: shouldShow,
    platform: platformInfo.platform,
    isIOS: platformInfo.platform === 'ios',
    isAndroid: platformInfo.platform === 'android',
    isDesktop: platformInfo.platform === 'desktop',
    installPrompt,
    handleInstall,
    handleDismiss,
    handlePostpone,
    showIOSInstructions,
    setShowIOSInstructions,
  };
}
