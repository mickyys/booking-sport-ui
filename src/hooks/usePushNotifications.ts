import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { requestForToken, onMessageListener } from '../lib/firebase';
import axios from 'axios';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    console.log('[PushNotifications] Component mounted');
  }, []);

  useEffect(() => {
    console.log('[PushNotifications] isAuthenticated changed:', isAuthenticated);
  }, [isAuthenticated]);

  const registerDevice = async (token: string) => {
    try {
      const accessToken = await getAccessTokenSilently();

      const userAgent = window.navigator.userAgent;
      let deviceName = 'Web Browser';
      let osVersion = 'Unknown OS';

      if (userAgent.indexOf('Win') !== -1) osVersion = 'Windows';
      if (userAgent.indexOf('Mac') !== -1) osVersion = 'MacOS';
      if (userAgent.indexOf('X11') !== -1) osVersion = 'UNIX';
      if (userAgent.indexOf('Linux') !== -1) osVersion = 'Linux';
      if (userAgent.indexOf('Android') !== -1) osVersion = 'Android';
      if (userAgent.indexOf('like Mac') !== -1) osVersion = 'iOS';

      if (userAgent.indexOf('Chrome') !== -1) deviceName = 'Chrome Browser';
      else if (userAgent.indexOf('Firefox') !== -1) deviceName = 'Firefox Browser';
      else if (userAgent.indexOf('Safari') !== -1) deviceName = 'Safari Browser';
      else if (userAgent.indexOf('Edge') !== -1) deviceName = 'Edge Browser';

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/devices`,
        {
          token,
          platform: 'web',
          device_name: deviceName,
          os_version: osVersion,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('[PushNotifications] Device registered for push notifications');

    } catch (err) {
      console.error('[PushNotifications] Error registering device:', err);
    }
  };

  useEffect(() => {
    console.log('[PushNotifications] isAuthenticated changed:', isAuthenticated);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      console.log('[PushNotifications] Current permission status:', Notification.permission);
      setPermissionStatus(Notification.permission);
    }

    if (isAuthenticated) {
      console.log('[PushNotifications] Setting up...');
      const setupNotifications = async () => {
        try {
          if ('serviceWorker' in navigator) {
            console.log('[PushNotifications] Registering service worker...');
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('[PushNotifications] Service worker registered');
          } else {
            console.log('[PushNotifications] Service worker not supported');
          }

          console.log('[PushNotifications] Requesting token...');
          const token = await requestForToken();
          console.log('[PushNotifications] Token result:', token ? 'success' : 'null');

          if (token) {
            setPermissionStatus('granted');
            await registerDevice(token);
          } else if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
          }
        } catch (error) {
          console.error('[PushNotifications] Error in setupNotifications:', error);
          if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
          }
        }
      };

      setupNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = onMessageListener((payload: any) => {
      if (payload?.notification) {
        toast.info(payload.notification.title, {
          description: payload.notification.body,
        });
      }
      console.log('Message received in foreground:', payload);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return { permissionStatus };
};
