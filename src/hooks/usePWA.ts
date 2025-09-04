import { useEffect, useState } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstalled: false,
    updateAvailable: false,
  });

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isInstalled = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      setPwaState(prev => ({ ...prev, isInstalled }));
    };

    // Check online status
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    // Listen for app installation
    const handleAppInstalled = () => {
      setPwaState(prev => ({ ...prev, isInstalled: true }));
    };

    // Initial check
    checkInstalled();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const updateApp = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    ...pwaState,
    updateApp,
  };
};