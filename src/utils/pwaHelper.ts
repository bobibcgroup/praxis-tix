/**
 * PWA Helper Utilities
 * Platform detection and installation utilities for Progressive Web App features
 */

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  isStandalone: boolean;
  isInstallable: boolean;
  browser: string;
}

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // Desktop detection (Chrome, Edge, Firefox, Safari)
  if (
    /Chrome/.test(userAgent) ||
    /Edg/.test(userAgent) ||
    /Firefox/.test(userAgent) ||
    /Safari/.test(userAgent)
  ) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Detect browser name
 */
export function detectBrowser(): string {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/Edg/.test(userAgent)) return 'Edge';
  if (/Chrome/.test(userAgent)) return 'Chrome';
  if (/Firefox/.test(userAgent)) return 'Firefox';
  if (/Safari/.test(userAgent)) return 'Safari';
  if (/Opera|OPR/.test(userAgent)) return 'Opera';

  return 'Unknown';
}

/**
 * Check if app is running in standalone mode (already installed)
 */
export function isStandalone(): boolean {
  // iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }

  // Android/Desktop standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check for standalone in query params (some browsers)
  if (window.location.search.includes('standalone=true')) {
    return true;
  }

  return false;
}

/**
 * Check if the platform supports native installation prompt
 */
export function supportsInstallPrompt(): boolean {
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = detectPlatform();
  const standalone = isStandalone();
  
  // Installable if:
  // - Not already installed (standalone)
  // - Supports install prompt (Android/Desktop Chrome/Edge)
  // - Or is iOS (can show manual instructions)
  const installable = !standalone && (
    supportsInstallPrompt() || 
    platform === 'ios'
  );

  return {
    platform,
    isStandalone: standalone,
    isInstallable: installable,
    browser: detectBrowser(),
  };
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  const platform = detectPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  return detectPlatform() === 'desktop';
}

/**
 * Get iOS version (if on iOS)
 */
export function getIOSVersion(): number | null {
  if (detectPlatform() !== 'ios') {
    return null;
  }

  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return parseFloat(`${match[1]}.${match[2]}`);
  }

  return null;
}

/**
 * Check if iOS version supports PWA features
 */
export function supportsIOSPWA(): boolean {
  const iosVersion = getIOSVersion();
  if (iosVersion === null) {
    return false;
  }

  // iOS 11.3+ supports PWAs
  return iosVersion >= 11.3;
}
