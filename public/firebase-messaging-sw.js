importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC8v73P2-_AxVKlyalzeG7GlNj3J05o9xw",
  authDomain: "reservaloya-2a59c.firebaseapp.com",
  projectId: "reservaloya-2a59c",
  storageBucket: "reservaloya-2a59c.firebasestorage.app",
  messagingSenderId: "393237392419",
  appId: "1:393237392419:web:c16f4c91ddb95c762f9596",
  measurementId: "G-47X0NH1R7M"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Manejar mensajes cuando la app está en background
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  // Soporta notification o data payload
  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "Nueva notificación";

  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/logo/favicon-32x32.png",
    badge: "/logo/favicon-32x32.png",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Evento cuando el usuario hace click en la notificación
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  const bookingId = event.notification.data?.booking_id;

  let urlToOpen = "/admin/dashboard";

  if (bookingId) {
    urlToOpen = `/admin/dashboard?booking_id=${bookingId}`;
  }

  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Si la ventana ya está abierta, enfocarla
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === fullUrl && "focus" in client) {
            return client.focus();
          }
        }

        // Si no está abierta, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});