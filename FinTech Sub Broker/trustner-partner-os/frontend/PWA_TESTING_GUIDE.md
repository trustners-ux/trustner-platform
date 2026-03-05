# PWA Testing Guide for Trustner Partner OS

Complete testing procedures for all PWA features.

## Environment Setup

### Prerequisites
- Chrome/Chromium browser (latest version)
- Android device or Chrome's mobile emulation
- HTTPS server (PWA requires HTTPS in production)
- Network inspection tools (Chrome DevTools)

### Development Setup
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Serve production build locally
npm run preview
```

## Testing Checklist

### 1. Service Worker Registration

**Desktop Testing**
```
Steps:
1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Load app in browser
4. Verify Service Worker appears with status "activated and running"
5. Check "Update on reload" option for development
6. Refresh page - SW should not re-register (cache hit)
```

Expected Results:
- Service Worker registers on first load
- No errors in console
- Status shows "activated and running"
- Lifecycle shows "activated"

**Mobile Testing**
```
Steps:
1. Push build to staging server (HTTPS required)
2. Visit on Android device
3. Open Chrome DevTools via:
   - Settings > Developer tools (if Chrome enabled)
   - Remote debugging via desktop Chrome
4. Check Application > Service Workers
```

### 2. Offline Functionality

**Test Offline Detection**
```
Steps:
1. Load app in browser
2. Open DevTools > Network tab
3. Check "Offline" checkbox
4. Reload page
5. Observe app behavior
```

Expected Results:
- OfflineIndicator shows at top
- Static assets (JS, CSS) load from cache
- Previously visited pages display
- Cached API data shows
- New API calls fail gracefully
- offline.html shown for new routes

**Test Online Restoration**
```
Steps:
1. App in offline mode
2. Uncheck "Offline" in DevTools
3. Watch for automatic page reload or indicator disappear
4. Try to load new data
```

Expected Results:
- OfflineIndicator disappears
- Page auto-reloads or shows reconnection message
- New API calls succeed
- Background sync triggers for queued requests

### 3. Caching Strategy

**Static Asset Caching**
```
Steps:
1. Open DevTools > Network tab
2. Set throttling to "Slow 3G"
3. Load app (first time - network requests)
4. Reload page (second time - should be cached)
5. Compare load times
```

Expected Results:
- First load: All JS/CSS/images from network
- Second load: All assets from cache
- Second load should be 50-70% faster
- File sizes show "from ServiceWorker"

**API Caching**
```
Steps:
1. Load dashboard (API calls made)
2. Go offline (DevTools > Network > Offline)
3. Go back to dashboard
4. Verify data displays from cache
5. Check Network tab - requests show cached responses
```

Expected Results:
- Dashboard displays with cached data
- No network errors
- User can view but not create new data

### 4. Install Prompt

**Desktop Testing (Windows/Mac)**
```
Steps:
1. Open Chrome on desktop
2. Visit app URL
3. Look for install icon in address bar (right side)
4. Click install
5. Verify app window opens separate from browser
6. Close app and re-open from desktop/taskbar
```

Expected Results:
- Install icon appears after viewing site 3+ times
- App installs as standalone
- Separate window without address bar
- Back button works
- App appears in system app list

**Mobile Testing (Android)**
```
Steps:
1. Open Chrome on Android
2. Visit app URL
3. Open menu (3 dots) > Install app
4. Or wait for install prompt to appear
5. Tap "Install"
6. Verify app on home screen
7. Launch from home screen
```

Expected Results:
- Install option appears in menu
- App installs to home screen with icon
- App runs in standalone mode (no browser UI)
- App icon uses custom Trustner logo
- Standalone mode detection working

**PWAInstallPrompt Component Testing**
```
Steps:
1. Clear site data (DevTools > Storage > Clear site data)
2. Reload app on mobile
3. Verify bottom banner appears
4. Click "Install" button
5. Verify install prompt appears
6. Click "Not Now" button
7. Reload page
8. Verify banner doesn't show (dismissal remembered)
```

Expected Results:
- Banner appears only on first visit
- Install button triggers system install prompt
- Dismissal remembered in sessionStorage
- Banner hidden after dismiss

### 5. Update Detection

**Test Update Notification**
```
Steps:
1. Load app with Service Worker
2. Change code and rebuild (e.g., update manifest.json)
3. In DevTools > Network, uncheck "Offline"
4. Reload page multiple times
5. Watch for update detected
```

Expected Results:
- New Service Worker detected
- Update prompt appears
- Click "Update Now" reloads with new version
- Cache version updated
- New code active after reload

**Background Update Check**
```
Steps:
1. App loaded with active Service Worker
2. Wait 1 minute (periodic update check)
3. Check DevTools > Application > Service Workers
4. Verify it shows "Update found"
```

Expected Results:
- Service Worker checks for updates every minute
- Updates detected automatically
- No console errors
- Graceful update handling

### 6. Mobile Navigation

**Test MobileNav Component**
```
Steps:
1. Resize browser to mobile width (< 768px)
2. Verify 5-tab navigation appears at bottom
3. Click each tab: Dashboard, Clients, Insurance, MF, More
4. Verify active tab highlighted in gold
5. Verify border at top of active tab
```

Expected Results:
- Navigation hidden on desktop (md:hidden)
- Navigation visible on mobile
- Active tab has gold accent (#D4A843)
- All 5 tabs clickable and navigate correctly
- Tab labels display with icons

**Test on Real Device**
```
Steps:
1. Visit app on Android device
2. Scroll down to see bottom navigation
3. Tap each tab
4. Verify smooth navigation
5. Verify icons load correctly
```

Expected Results:
- Navigation sticky at bottom
- Doesn't scroll away with content
- Touch targets large enough (40px+ height)
- Icons display correctly on all screens

### 7. Pull-to-Refresh

**Test Gesture Detection**
```
Steps:
1. Open app on mobile or Chrome mobile emulation
2. Scroll to top of page
3. Pull down (touchstart + touchmove downward)
4. Observe spinner animation
5. Release (touchend)
6. Verify refresh callback executed
```

Expected Results:
- Pull header appears while dragging
- Spinner animates as you pull
- Release triggers refresh callback
- Content opacity dims during refresh
- Spinner disappears after refresh completes

**Test Threshold**
```
Steps:
1. Pull down 30px - no refresh triggered on release
2. Pull down 60px+ - refresh triggered on release
3. Pull down 90px+ - full resistance effect visible
```

Expected Results:
- Threshold is 60px (PULL_THRESHOLD)
- Smooth resistance animation
- Only triggers on sufficient pull distance

**Test Error Handling**
```
Steps:
1. Enable offline mode
2. Try pull-to-refresh
3. Observe error handling in callback
```

Expected Results:
- Error caught gracefully
- No crash or blank screen
- User sees error notification if applicable

### 8. Responsive Design

**Test Media Query Hooks**
```
Steps:
1. Add debug component to display screen size
2. Resize window across breakpoints:
   - < 640px (useIsSmall)
   - 640-767px (useIsMedium)
   - 768-1023px (useIsTablet)
   - 1024px+ (useIsDesktop)
3. Verify hooks return correct values
```

Expected Results:
- useIsMobile true for < 768px
- useIsTablet true for 768-1024px
- useIsDesktop true for > 1024px
- Values change on window resize
- No lag or flickering

**Test Touch Detection**
```
Steps:
1. Use Chrome DevTools > More tools > Sensors
2. Change "Touch" to "Force enabled"
3. Test touch-specific features
4. Verify useIsTouchDevice() returns true
```

Expected Results:
- Touch-specific UI shows
- Mouse-specific features hide
- No conflicts between touch/mouse
- Performance acceptable

### 9. Offline Indicator

**Test Appearance**
```
Steps:
1. Enable offline mode (DevTools > Network)
2. Verify red bar appears at top
3. Check text: "You are offline"
4. Disable offline
5. Verify bar disappears
```

Expected Results:
- Red bar (#EF4444) at top
- White text with icon
- Smooth fade in/out animation
- No performance impact

**Test Network Events**
```
Steps:
1. Disable WiFi/mobile data
2. Verify indicator shows
3. Re-enable connection
4. Verify indicator auto-hides
```

Expected Results:
- Detects real network disconnection
- Not just navigator.onLine value
- Responds quickly to changes

### 10. Notifications

**Test Permission Request**
```
Steps:
1. Call requestNotificationPermission() from console
2. Grant permission when prompted
3. Call sendNotification("Test", {body: "Hello"})
4. Verify notification appears
```

Expected Results:
- Browser shows permission dialog
- Grant saves permission
- Notification displays with correct icon
- Click navigates to app

**Test Push Notifications** (requires backend)
```
Steps:
1. Subscribe to push notifications
2. Send notification from backend
3. Click notification
4. Verify app opens at correct URL
```

Expected Results:
- Notification shows even if app closed
- Click triggers notification click handler
- App opens with badge notification

### 11. Background Sync

**Test Failed Request Storage**
```
Steps:
1. Enable offline mode
2. Submit form (triggers failed request)
3. Call storeFailedRequest() manually
4. Disable offline mode
5. Trigger sync (app should auto-retry)
```

Expected Results:
- Request stored in IndexedDB
- Service Worker detects when online
- Auto-retry occurs
- User notified of success/failure

### 12. Browser Compatibility

**Chrome/Edge**
- [ ] Service Worker registers
- [ ] Install prompt shows
- [ ] Offline mode works
- [ ] Notifications work
- [ ] Background sync works
- [ ] All mobile features work

**Firefox**
- [ ] Service Worker registers
- [ ] Offline mode works
- [ ] Install prompt doesn't show (expected)
- [ ] Notifications work
- [ ] Mobile features work (limited)
- [ ] No console errors

**Safari (iOS/macOS)**
- [ ] Service Worker registers (iOS 11.3+)
- [ ] App adds to home screen
- [ ] Offline mode limited
- [ ] Notifications don't work (expected)
- [ ] Mobile features work

## Performance Testing

### Load Time Measurements

**First Visit (Cold Cache)**
```
DevTools > Network > Reload
Measure:
- Document load time
- JS bundle load time
- Total page load time
- Time to interactive (TTI)
```

Target: < 3 seconds on 3G

**Second Visit (Warm Cache)**
```
DevTools > Network > Reload (with SW active)
Measure:
- Document load time (should be cached)
- Total load time (should be 50-70% faster)
```

Target: < 1 second

### Lighthouse PWA Audit

```
Steps:
1. Build app: npm run build
2. Open DevTools > Lighthouse
3. Select "PWA" category
4. Run audit on production build
5. Review score and recommendations
```

Expected Results:
- Install prompt works
- Offline page exists
- Meta tags present
- Icons present and correct sizes
- Manifest valid
- HTTPS required in production

## Debugging Tips

### Service Worker Issues

**Check registration:**
```javascript
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));
```

**View logs:**
- DevTools > Application > Service Workers > [Your SW]
- See "Skip waiting" option to force update

**Clear cache:**
```javascript
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Offline Mode Debugging

**Check network status:**
```javascript
console.log(navigator.onLine); // true/false
```

**View cached responses:**
- DevTools > Application > Cache Storage
- Click cache name to see entries

**Test offline fetch:**
```javascript
fetch('/api/test').then(r => r.json()).then(console.log);
// Will use cached response if offline
```

### Installation Debugging

**Check install prompt:**
```javascript
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt available', e);
});
```

**Check standalone mode:**
```javascript
console.log(
  'Standalone:', window.matchMedia('(display-mode: standalone)').matches,
  'Navigator:', navigator.standalone,
  'Referrer:', document.referrer
);
```

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| SW not registering | Wrong path or 404 | Check sw.js in public/ |
| Offline page not showing | Not in STATIC_ASSETS | Add to sw.js STATIC_ASSETS |
| Install prompt not showing | Not on HTTPS or <3 visits | Use HTTPS, visit 3+ times |
| Old version cached | Cache not cleared | Change CACHE_NAME in sw.js |
| Icons not showing | Wrong paths in manifest | Check /public/icons/ exists |
| MobileNav not visible | Breakpoint too large | Check useIsMobile() logic |
| Pull-to-refresh not working | Only on mobile | Test on mobile or emulation |

## Sign-off Checklist

Before deploying to production:

- [ ] Service Worker registers without errors
- [ ] Offline mode tested and working
- [ ] Install prompt functional on Android
- [ ] Mobile navigation displays correctly
- [ ] Pull-to-refresh functional
- [ ] All icons present and correct
- [ ] Manifest valid (no console errors)
- [ ] offline.html displays when needed
- [ ] Push notifications working (if implemented)
- [ ] Background sync functional (if implemented)
- [ ] Lighthouse PWA audit passes (90%+)
- [ ] No console errors or warnings
- [ ] Mobile performance acceptable (<3s initial load)
- [ ] Responsive design tested on multiple devices
- [ ] HTTPS enabled for production
- [ ] Tested on Chrome, Firefox, Safari

## Testing Report Template

```
=== PWA TESTING REPORT ===
Date: [date]
Tester: [name]
Build: [version]

FEATURES TESTED:
- [ ] Service Worker Registration
- [ ] Offline Functionality
- [ ] Caching Strategy
- [ ] Install Prompt
- [ ] Update Detection
- [ ] Mobile Navigation
- [ ] Pull-to-Refresh
- [ ] Responsive Design
- [ ] Offline Indicator
- [ ] Notifications
- [ ] Background Sync

DEVICES TESTED:
- [ ] Chrome Desktop
- [ ] Chrome Mobile (Android)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

ISSUES FOUND:
1. [Issue description]
2. [Issue description]

PASSED: [Y/N]
SIGN-OFF: [Initials]
```

## Next Steps

1. Complete all tests in checklist
2. Document any issues found
3. Verify fixes on all devices
4. Run Lighthouse audit
5. Deploy to production
6. Monitor for user issues
7. Gather user feedback on features
