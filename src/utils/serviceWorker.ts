/**
 * Service Worker Registration
 * Registers the service worker for PWA functionality
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('[Service Worker] Registered successfully:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[Service Worker] New version available');
                  // Optionally show update notification to user
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    });

    // Handle service worker controller changes (page refresh after update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Service Worker] Controller changed - reloading page');
      window.location.reload();
    });
  }
}

/**
 * Unregister service worker (for development/testing)
 */
export function unregisterServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[Service Worker] Unregistered successfully');
        }
      });
    });
  }
}
