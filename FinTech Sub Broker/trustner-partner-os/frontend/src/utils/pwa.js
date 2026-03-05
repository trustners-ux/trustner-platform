let installPrompt = null;

/**
 * Register the Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available
            showUpdatePrompt();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(vapidKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await requestNotificationPermission();

    if (!permission) {
      console.warn('Notification permission denied');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    console.log('Push subscription successful:', subscription);
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Check for Service Worker updates
 */
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }

  return false;
}

/**
 * Show update prompt to user
 */
function showUpdatePrompt() {
  const updateEvent = new CustomEvent('pwa-update-available', {
    detail: {
      message: 'A new version of Trustner is available',
      action: 'update'
    }
  });

  window.dispatchEvent(updateEvent);
}

/**
 * Detect if app is running in standalone mode (installed PWA)
 */
export function isStandalone() {
  const isStandaloneMode = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  };

  return isStandaloneMode();
}

/**
 * Check if device can install PWA
 */
export function canInstall() {
  return installPrompt !== null;
}

/**
 * Prompt user to install PWA
 */
export async function promptInstall() {
  if (!installPrompt) {
    console.warn('Install prompt not available');
    return false;
  }

  try {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;

    return outcome === 'accepted';
  } catch (error) {
    console.error('Install prompt failed:', error);
    return false;
  }
}

/**
 * Initialize PWA install prompt listener
 */
export function initializeInstallPrompt(callback) {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;

    if (callback) {
      callback(true);
    }
  });

  // Listen for app being installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    installPrompt = null;

    if (callback) {
      callback(false);
    }
  });
}

/**
 * Send notification
 */
export async function sendNotification(title, options = {}) {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      ...options
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Store failed request for background sync
 */
export async function storeFailedRequest(url, method, headers, body) {
  if (!window.indexedDB) {
    console.warn('IndexedDB is not supported');
    return false;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open('trustner-failed-requests', 1);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      resolve(false);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['failed-requests'], 'readwrite');
      const store = transaction.objectStore('failed-requests');

      const failedRequest = {
        id: Date.now() + Math.random(),
        url,
        method,
        headers,
        body,
        timestamp: new Date().toISOString()
      };

      const addRequest = store.add(failedRequest);

      addRequest.onerror = () => {
        console.error('Failed to store request');
        resolve(false);
      };

      addRequest.onsuccess = () => {
        console.log('Failed request stored for sync');
        // Request background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register('sync-forms').catch((error) => {
              console.warn('Failed to register sync:', error);
            });
          });
        }
        resolve(true);
      };
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('failed-requests')) {
        db.createObjectStore('failed-requests', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Listen for Service Worker controller change (update available)
 */
export function onUpdateAvailable(callback) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      callback();
    });
  }

  window.addEventListener('pwa-update-available', () => {
    callback();
  });
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    return true;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}
