const CACHE_NAME = 'activities-v2';

// Skip caching entirely in development - let everything load fresh
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't intercept anything - let all requests go through normally
  return;
});

// Push notifications for activity reminders
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'تذكير بنشاط';
    const options = {
      body: data.body || '',
      icon: '/logo-original.jpg',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
      tag: data.tag || 'activity-reminder',
      requireInteraction: data.requireInteraction || false,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('تذكير بنشاط', {
        body: event.data.text(),
        icon: '/logo-original.jpg',
        dir: 'rtl',
        vibrate: [200, 100, 200],
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
