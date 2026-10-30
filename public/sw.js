// Web push only: no caching. Shows what the API sends, and opens its link when tapped.
self.addEventListener('push', (event) => {
    const { title, body, url } = event.data ? event.data.json() : {};
    if (!title) return;
    event.waitUntil(self.registration.showNotification(title, { body, icon: '/icon-192.png', data: { url } }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/'));
});
