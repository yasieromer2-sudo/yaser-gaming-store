// Production-Ready Service Worker for Real Push Notifications
// Standard Gaming Platform

const CACHE_NAME = 'sg-push-cache-v1';
const DEFAULT_TITLE = 'إشعار من المتجر';
const DEFAULT_ICON = '/icon-192.png';
const DEFAULT_BADGE = '/badge-72.png';

// Service Worker Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PUSH EVENT HANDLER
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: DEFAULT_TITLE,
        body: event.data.text(),
      };
    }
  }

  const title = data.title || DEFAULT_TITLE;
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    tag: data.tag || `notif-${Date.now()}`,
    renotify: data.renotify ?? false,
    silent: false, // Ensures real system notification sound on device
    vibrate: data.vibrate || [200, 100, 200], // Native vibration pattern on Android
    data: {
      id: data.data?.id || data.id,
      targetUrl: data.data?.targetUrl || data.targetUrl || '/',
      type: data.data?.type || data.type || 'info',
      meta: data.data?.meta || data.meta || {},
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'فتح ومتابعة' }
    ],
  };

  // Show system push notification
  const notificationPromise = self.registration.showNotification(title, options);

  // Also broadcast to any active open windows so UI updates instantly
  const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'PUSH_NOTIFICATION_RECEIVED',
        notification: {
          id: options.data.id,
          title,
          body: options.body,
          targetUrl: options.data.targetUrl,
          type: options.data.type,
          data: options.data.meta,
          createdAt: new Date().toISOString(),
        },
      });
    });
  });

  event.waitUntil(Promise.all([notificationPromise, broadcastPromise]));
});

// NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.targetUrl || '/';

  // Ensure relative or absolute URL format
  if (!targetUrl.startsWith('/') && !targetUrl.startsWith('http')) {
    targetUrl = '/' + targetUrl;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a browser window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            targetUrl: targetUrl,
          });
          return client.focus();
        }
      }
      // If no window is open, open a fresh window to the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// NOTIFICATION CLOSE HANDLER
self.addEventListener('notificationclose', (event) => {
  // Can be used for analytics if needed
});
