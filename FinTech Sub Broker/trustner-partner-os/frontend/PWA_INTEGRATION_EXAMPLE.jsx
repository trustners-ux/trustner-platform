/**
 * EXAMPLE: How to integrate PWA components into your App.jsx
 *
 * This is a reference implementation showing best practices for using
 * all the PWA components and utilities together.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// PWA Components
import PWAInstallPrompt from './src/components/PWAInstallPrompt';
import OfflineIndicator from './src/components/OfflineIndicator';
import MobileNav from './src/components/MobileNav';
import PullToRefresh from './src/components/PullToRefresh';

// PWA Utilities
import {
  registerServiceWorker,
  initializeInstallPrompt,
  onUpdateAvailable,
  sendNotification,
  isStandalone
} from './src/utils/pwa';

// Media Query Hooks
import { useIsMobile } from './src/hooks/useMediaQuery';

// Your existing layouts and pages
import DashboardPage from './src/pages/DashboardPage';
import ClientsPage from './src/pages/ClientsPage';
import InsurancePage from './src/pages/InsurancePage';
import MutualFundsPage from './src/pages/MutualFundsPage';
import MenuPage from './src/pages/MenuPage';

/**
 * Main App Component with PWA Integration
 */
function App() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();

  /**
   * Initialize PWA features on mount
   */
  useEffect(() => {
    // 1. Register Service Worker
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('✓ Service Worker registered');
      }
    });

    // 2. Initialize install prompt listener
    // This allows the PWAInstallPrompt component to show the install banner
    initializeInstallPrompt((canInstall) => {
      console.log('Install prompt available:', canInstall);
    });

    // 3. Listen for app updates
    // Shows update prompt when new version is available
    onUpdateAvailable(() => {
      console.log('New version available');
      setShowUpdatePrompt(true);

      // Optional: Show browser notification
      if (Notification.permission === 'granted') {
        sendNotification('Trustner Update', {
          body: 'A new version is available. Please refresh to update.',
          tag: 'trustner-update'
        });
      }
    });

    // 4. Log if running as installed app
    if (isStandalone()) {
      console.log('✓ App running in standalone mode (installed)');
    }
  }, []);

  /**
   * Handle pull-to-refresh
   * This gets called when user pulls down to refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Example: Fetch fresh dashboard data
      // Replace with your actual data fetching logic
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fresh data loaded:', data);
        // Update your app state with new data
        // dispatch(updateDashboard(data));
      }

      // Show success notification
      await sendNotification('Refreshed', {
        body: 'Dashboard updated with latest data',
        tag: 'trustner-refresh'
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      // Show error notification
      if (navigator.onLine) {
        await sendNotification('Refresh Failed', {
          body: 'Could not fetch latest data. Check your connection.',
          tag: 'trustner-refresh-error'
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle app update prompt
   */
  const handleUpdateApp = () => {
    // Reload page to get new Service Worker version
    window.location.reload();
  };

  return (
    <BrowserRouter>
      {/* Offline status indicator - appears at top when offline */}
      <OfflineIndicator />

      {/* Install prompt banner - appears at bottom on mobile */}
      <PWAInstallPrompt />

      {/* Update prompt - appears when new version available */}
      {showUpdatePrompt && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">Update Available</p>
            <p className="text-sm">A new version of Trustner is ready</p>
          </div>
          <button
            onClick={handleUpdateApp}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800 font-medium text-sm"
          >
            Update Now
          </button>
          <button
            onClick={() => setShowUpdatePrompt(false)}
            className="ml-2 text-xl hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main content with pull-to-refresh support */}
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Add padding to account for mobile navigation at bottom */}
        <div className={isMobile ? 'pb-20' : ''}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/insurance" element={<InsurancePage />} />
            <Route path="/mutual-funds" element={<MutualFundsPage />} />
            <Route path="/menu" element={<MenuPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </PullToRefresh>

      {/* Mobile bottom navigation - only visible on mobile screens */}
      {isMobile && <MobileNav />}
    </BrowserRouter>
  );
}

/**
 * USAGE PATTERNS
 *
 * 1. RESPONSIVE LAYOUTS
 *    Use media query hooks in your pages:
 *
 *    import { useIsMobile, useIsTablet } from './src/hooks/useMediaQuery';
 *
 *    function MyPage() {
 *      const isMobile = useIsMobile();
 *      return (
 *        <div>
 *          {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *        </div>
 *      );
 *    }
 *
 * 2. OFFLINE HANDLING
 *    Use navigator.onLine or listen to online/offline events:
 *
 *    useEffect(() => {
 *      const handleOnline = () => console.log('Back online');
 *      window.addEventListener('online', handleOnline);
 *      return () => window.removeEventListener('online', handleOnline);
 *    }, []);
 *
 * 3. BACKGROUND SYNC
 *    For failed form submissions, store them for retry:
 *
 *    import { storeFailedRequest } from './src/utils/pwa';
 *
 *    try {
 *      const response = await fetch('/api/form', {
 *        method: 'POST',
 *        body: JSON.stringify(formData)
 *      });
 *    } catch (error) {
 *      // Store for background sync when online
 *      await storeFailedRequest(
 *        '/api/form',
 *        'POST',
 *        { 'Content-Type': 'application/json' },
 *        JSON.stringify(formData)
 *      );
 *    }
 *
 * 4. PUSH NOTIFICATIONS
 *    Request permission and subscribe:
 *
 *    import {
 *      requestNotificationPermission,
 *      subscribeToPushNotifications
 *    } from './src/utils/pwa';
 *
 *    const hasPermission = await requestNotificationPermission();
 *    if (hasPermission) {
 *      const subscription = await subscribeToPushNotifications(vapidKey);
 *      // Send subscription to backend to save
 *    }
 *
 * 5. TESTING SERVICE WORKER
 *    In Chrome DevTools:
 *    1. Go to Application > Service Workers
 *    2. Check "Offline" to simulate offline mode
 *    3. Check "Update on reload" for SW updates
 *    4. View cached assets in Cache Storage
 */

export default App;
