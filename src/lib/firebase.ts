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
  console.log('[Firebase] requestForToken called');
  console.log('[Firebase] messaging available:', !!messaging);
  
  if (!messaging) {
    console.warn("[Firebase] Firebase messaging not initialized. Check your configuration.");
    console.warn("[Firebase] VAPID_KEY set:", !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
    console.warn("[Firebase] API_KEY set:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    return null;
  }
  
  try {
    console.log('[Firebase] Checking Notification permission...');
    console.log('[Firebase] Notification in window:', typeof window !== 'undefined' && 'Notification' in window);
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      console.log('[Firebase] Current Notification.permission:', Notification.permission);
      
      // Only request if permission is default
      if (Notification.permission === 'default') {
        console.log('[Firebase] Requesting permission from user...');
        const permission = await Notification.requestPermission();
        console.log('[Firebase] Permission result:', permission);
        if (permission !== 'granted') {
          return null;
        }
      } else if (Notification.permission === 'denied') {
        console.log('[Firebase] Permission already denied');
        return null;
      } else if (Notification.permission === 'granted') {
        console.log('[Firebase] Permission already granted');
      }
    } else {
      console.log('[Firebase] Notifications not supported');
      return null;
    }

    console.log('[Firebase] Getting FCM token...');
    console.log('[Firebase] VAPID key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'set' : 'not set');
    
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      console.log('[Firebase] Token obtained successfully');
      return currentToken;
    } else {
      console.log('[Firebase] No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('[Firebase] Error getting token: ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
