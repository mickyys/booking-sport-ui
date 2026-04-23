importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase para el Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyC8v73P2-_AxVKlyalzeG7GlNj3J05o9xw",
  authDomain: "reservaloya-2a59c.firebaseapp.com",
  projectId: "reservaloya-2a59c",
  storageBucket: "reservaloya-2a59c.firebasestorage.app",
  messagingSenderId: "393237392419",
  appId: "1:393237392419:web:c16f4c91ddb95c762f9596",
  measurementId: "G-47X0NH1R7M"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo/favicon-32x32.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.');
  event.notification.close();

  const bookingId = event.notification.data?.booking_id;
  if (bookingId) {
    const urlToOpen = new URL(`/admin/dashboard?booking_id=${bookingId}`, self.location.origin).href;
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
