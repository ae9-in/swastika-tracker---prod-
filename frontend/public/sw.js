self.addEventListener('push', (event) => {
    const data = event.data?.json?.() || {};
    const options = {
        body: data.body || 'New Notification!',
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/favicon.svg',
        image: data.image,
        tag: data.tag || 'swastik-notification',
        renotify: data.renotify ?? true,
        requireInteraction: data.requireInteraction ?? true,
        vibrate: data.vibrate || [200, 100, 200],
        actions: data.actions || [],
        data: {
            url: data.url || data.data?.url || '/',
            affiliateUrl: data.data?.affiliateUrl || null
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Swastik Tracker', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl =
        event.action === 'open-affiliate' && event.notification.data.affiliateUrl
            ? event.notification.data.affiliateUrl
            : event.notification.data.url;

    event.waitUntil(
        clients.openWindow(targetUrl)
    );
});
