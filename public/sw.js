self.addEventListener('push', function (e) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    if (e.data) {
        var msg = e.data.json();
        e.waitUntil(self.registration.showNotification(msg.title, {
            body: msg.body,
            icon: msg.icon || '/icon-512x512.png',
            actions: msg.actions || [],
            data: msg.data || {}
        }));
    }
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    if (e.notification.data && e.notification.data.url) {
        e.waitUntil(clients.openWindow(e.notification.data.url));
    }
});
