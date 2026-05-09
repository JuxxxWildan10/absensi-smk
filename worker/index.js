self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notifikasi Baru";
  const body = data.body || "Sistem Absensi";
  const icon = data.icon || "/logo-smk.jpg";
  const badge = data.badge || "/logo-smk.jpg";

  const options = {
    body,
    icon,
    badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "Buka Aplikasi",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
