import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if we have at least the essential config
const hasConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && hasConfig) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    // Initialize Analytics only if supported and in browser
    isSupported().then(yes => yes && getAnalytics(app));
  } catch (error) {
    console.error("Firebase initialization failed", error);
  }
}

export { messaging };

export const requestForToken = async () => {
  if (!messaging) {
    console.warn("Firebase messaging not initialized. Check your configuration.");
    return null;
  }
  
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Only request if permission is default
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return null;
        }
      } else if (Notification.permission === 'denied') {
        return null;
      }
    }

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
