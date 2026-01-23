# PWA "Add to Home Screen" Implementation Guide

## Overview

This implementation provides a comprehensive, user-friendly "Add to Home Screen" (A2HS) experience for the Praxis app. It includes platform-specific prompts, smart timing logic, and seamless integration with the app's design system.

## Features

✅ **Platform Detection** - Automatically detects iOS, Android, and Desktop platforms  
✅ **Smart Timing** - Shows prompt only after user engagement (2+ visits, 30+ seconds)  
✅ **User Preferences** - Remembers dismissals and respects user choices  
✅ **Design System Integration** - Matches app's sage green theme and design tokens  
✅ **Dark Mode Support** - Works seamlessly in both light and dark themes  
✅ **Accessibility** - Full ARIA labels, keyboard navigation, and screen reader support  
✅ **Service Worker** - Offline capability with network-first caching strategy  
✅ **iOS Instructions** - Step-by-step manual instructions for iOS Safari  

## File Structure

```
src/
├── components/
│   ├── AddToHomeScreen.tsx              # Main orchestrator component
│   └── AddToHomeScreen/
│       ├── IOSPrompt.tsx               # iOS-specific prompt with instructions
│       ├── AndroidPrompt.tsx           # Android Chrome/Edge prompt
│       └── DesktopPrompt.tsx           # Desktop Chrome/Edge prompt
├── hooks/
│   └── useAddToHomeScreen.ts           # Main hook with timing logic
└── utils/
    ├── pwaHelper.ts                     # Platform detection utilities
    └── serviceWorker.ts                 # Service worker registration

public/
├── manifest.json                        # PWA manifest (updated)
└── service-worker.js                   # Service worker with caching

index.html                              # Updated with PWA meta tags
```

## Components

### AddToHomeScreen.tsx

Main component that orchestrates platform-specific prompts. Automatically detects platform and renders the appropriate UI.

**Usage:**
```tsx
import { AddToHomeScreen } from '@/components/AddToHomeScreen';

// Add to your App.tsx
<AddToHomeScreen />
```

### useAddToHomeScreen Hook

Custom hook that manages:
- Installation state detection
- Smart timing logic (visits, time spent)
- User preference tracking (localStorage)
- Platform detection
- Installation event handling

**Returns:**
```typescript
{
  isInstallable: boolean;
  isInstalled: boolean;
  shouldShowPrompt: boolean;
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  installPrompt: InstallPromptEvent | null;
  handleInstall: () => Promise<void>;
  handleDismiss: (permanent?: boolean) => void;
  handlePostpone: () => void;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
}
```

## Smart Timing Logic

The prompt appears only when:

1. **Visit Requirements**: User has visited 2+ times
2. **Time Requirements**: User has spent 30+ seconds total on the site
3. **Cooldown Period**: Not dismissed in the last 7 days
4. **Recent Display**: Not shown in the last hour
5. **Installability**: Platform supports installation
6. **Not Installed**: App is not already installed

### Timing Configuration

You can adjust these constants in `useAddToHomeScreen.ts`:

```typescript
const MIN_VISITS = 2;                    // Minimum visits before showing
const MIN_TIME_SPENT = 30;              // Minimum seconds before showing
const DISMISSAL_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY = 3000;                // 3 seconds after page load
```

## Platform-Specific Behavior

### iOS (Safari)

- **Prompt Style**: Bottom banner with app icon
- **Installation**: Manual instructions dialog (iOS doesn't support programmatic install)
- **Instructions**: Step-by-step guide with visual cues
- **Features**: Safe area insets support for iPhone X+

### Android (Chrome/Edge)

- **Prompt Style**: Bottom banner
- **Installation**: Uses native `beforeinstallprompt` event
- **Features**: One-tap installation

### Desktop (Chrome/Edge)

- **Prompt Style**: Top-right notification card
- **Installation**: Uses native `beforeinstallprompt` event
- **Features**: Less intrusive, smaller footprint

## Design System Integration

The prompts use your app's design tokens:

- **Colors**: Sage green primary (`hsl(150 20% 28%)`), matches theme
- **Typography**: Inter font family, matches app
- **Spacing**: Uses spacing scale (xs, sm, md, lg, xl)
- **Border Radius**: `rounded-lg` (12px) for cards
- **Shadows**: `shadow-lg` for elevation
- **Animations**: `slide-in-from-bottom-4`, `fade-in-0` with 300ms duration
- **Dark Mode**: Full support with theme-aware colors

## Service Worker

The service worker implements a **network-first** caching strategy:

1. **Install Event**: Caches essential assets (`/`, `/index.html`, `/manifest.json`)
2. **Fetch Event**: 
   - Tries network first
   - Falls back to cache if network fails
   - Caches successful responses for future use
3. **Activate Event**: Cleans up old caches

**Registration**: Automatically registered in `main.tsx` on app load.

## Manifest.json

Updated with:
- **Theme Color**: `#4a6b5a` (sage green)
- **Background Color**: `#faf9f7` (warm neutral)
- **Icons**: All required sizes with `maskable` purpose
- **Shortcuts**: Quick actions for "New Outfit" and "History"
- **Categories**: Lifestyle, productivity, utilities

## HTML Meta Tags

Added to `index.html`:

```html
<!-- PWA Meta Tags -->
<meta name="theme-color" content="#4a6b5a" />
<meta name="mobile-web-app-capable" content="yes" />

<!-- iOS PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Praxis" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## User Preferences (localStorage)

State is stored in `localStorage` under key `praxis_a2hs_state`:

```typescript
{
  visitCount: number;           // Total visits
  timeSpent: number;            // Total seconds spent
  lastDismissed: number | null; // Timestamp of last dismissal
  permanentlyDismissed: boolean; // User chose "Don't show again"
  installed: boolean;           // App is installed
  lastShown: number | null;     // Timestamp of last prompt display
}
```

## Testing

### Local Development

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test on Desktop Chrome**:
   - Open DevTools → Application → Service Workers
   - Check "Update on reload"
   - The prompt should appear after 2 visits + 30 seconds

3. **Test on Mobile**:
   - Use Chrome DevTools device emulation
   - Or connect a real device via USB debugging
   - For iOS, use Safari on a real device (simulator doesn't support PWA)

### Testing Checklist

- [ ] Prompt appears only after 2+ visits
- [ ] Prompt appears only after 30+ seconds total time
- [ ] Prompt respects dismissal (7-day cooldown)
- [ ] Prompt doesn't show if already installed
- [ ] iOS shows instructions dialog
- [ ] Android uses native install prompt
- [ ] Desktop shows top-right notification
- [ ] Dark mode works correctly
- [ ] Service worker registers successfully
- [ ] Manifest validates (check with Lighthouse)
- [ ] Icons display correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces prompts

### Lighthouse PWA Audit

Run Lighthouse audit to verify PWA compliance:

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit

**Expected Results**:
- ✅ Installable
- ✅ Service Worker registered
- ✅ Manifest valid
- ✅ Icons provided
- ✅ Theme color set

## Troubleshooting

### Prompt Not Showing

1. **Check localStorage**: Clear `praxis_a2hs_state` to reset state
2. **Check console**: Look for service worker registration errors
3. **Check platform**: Verify platform detection is working
4. **Check timing**: Ensure visit/time requirements are met

### Service Worker Not Registering

1. **Check HTTPS**: Service workers require HTTPS (or localhost)
2. **Check path**: Ensure `service-worker.js` is in `/public` folder
3. **Check console**: Look for registration errors
4. **Clear cache**: Clear browser cache and reload

### iOS Instructions Not Showing

1. **Check iOS version**: Requires iOS 11.3+
2. **Check Safari**: Must use Safari (not Chrome on iOS)
3. **Check standalone**: Ensure not already in standalone mode

## Customization

### Change Prompt Timing

Edit `src/hooks/useAddToHomeScreen.ts`:

```typescript
const MIN_VISITS = 3;        // Change minimum visits
const MIN_TIME_SPENT = 60;   // Change minimum seconds
const SHOW_DELAY = 5000;     // Change delay before showing
```

### Change Prompt Design

Edit platform-specific components:
- `src/components/AddToHomeScreen/IOSPrompt.tsx`
- `src/components/AddToHomeScreen/AndroidPrompt.tsx`
- `src/components/AddToHomeScreen/DesktopPrompt.tsx`

### Change Service Worker Strategy

Edit `public/service-worker.js` to implement different caching strategies:
- **Cache First**: For offline-first apps
- **Network First**: Current implementation (good for dynamic content)
- **Stale While Revalidate**: Best of both worlds

## Analytics (Optional)

To track installation rates, add analytics in `handleInstall`:

```typescript
const handleInstall = useCallback(async () => {
  // Track installation attempt
  analytics.track('pwa_install_attempted', {
    platform: platformInfo.platform,
  });
  
  // ... existing installation logic
  
  if (choiceResult.outcome === 'accepted') {
    analytics.track('pwa_install_success', {
      platform: platformInfo.platform,
    });
  }
}, [installPrompt, platformInfo.platform]);
```

## Browser Support

| Platform | Browser | Support |
|----------|---------|---------|
| iOS 11.3+ | Safari | ✅ Full (manual install) |
| Android 5+ | Chrome | ✅ Full (native prompt) |
| Android 5+ | Edge | ✅ Full (native prompt) |
| Desktop | Chrome | ✅ Full (native prompt) |
| Desktop | Edge | ✅ Full (native prompt) |
| Desktop | Firefox | ⚠️ Partial (no native prompt) |
| Desktop | Safari | ⚠️ Partial (no native prompt) |

## Future Enhancements

Potential improvements:

1. **Mini-infobar**: Use Chrome's new mini install UI
2. **Install Analytics**: Track installation rates
3. **A/B Testing**: Test different prompt variations
4. **Custom Icons**: Let users choose icon before installing
5. **Offline Queue**: Queue actions when offline
6. **Push Notifications**: Add push notification support
7. **Background Sync**: Sync data in background

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: Add to Home Screen](https://web.dev/add-to-home-screen/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

For issues or questions:
1. Check console for errors
2. Verify service worker registration
3. Check localStorage state
4. Test on different platforms
5. Run Lighthouse audit

---

**Implementation Date**: January 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete and Production Ready
