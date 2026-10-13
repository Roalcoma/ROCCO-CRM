// Service worker de Rocco CRM: notificaciones push y caché del shell.
const CACHE = 'rocco-shell-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Caché: assets con hash = inmutables; la API nunca se cachea.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api')) return;
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    })));
  } else if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('/', copy));
      return res;
    }).catch(() => caches.match('/')));
  }
});

// Push: siempre se muestra la notificación (iOS revoca la suscripción si no).
self.addEventListener('push', (e) => {
  let data = { title: 'Rocco CRM', body: '', url: '/', tag: 'general' };
  try { data = { ...data, ...e.data.json() }; } catch { /* payload vacío */ }
  e.waitUntil((async () => {
    await self.registration.showNotification(data.title, {
      body: data.body, tag: data.tag, renotify: true, data: { url: data.url },
      icon: '/icons/icon-192.png', badge: '/icons/badge-72.png',
    });
    if (self.navigator.setAppBadge) await self.navigator.setAppBadge().catch(() => {});
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || '/', location.origin).href;
  e.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((w) => w.url.startsWith(location.origin));
    if (existing) {
      await existing.focus();
      return existing.navigate(target);
    }
    return self.clients.openWindow(target);
  })());
});
