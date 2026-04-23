import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { requestForToken, onMessageListener } from '../lib/firebase';
import axios from 'axios';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  const registerDevice = async (token: string) => {
    try {
      const accessToken = await getAccessTokenSilently();
      
      // Get basic device info from user agent
      const userAgent = window.navigator.userAgent;
      let deviceName = 'Web Browser';
      let osVersion = 'Unknown OS';

      if (userAgent.indexOf('Win') !== -1) osVersion = 'Windows';
      if (userAgent.indexOf('Mac') !== -1) osVersion = 'MacOS';
      if (userAgent.indexOf('X11') !== -1) osVersion = 'UNIX';
      if (userAgent.indexOf('Linux') !== -1) osVersion = 'Linux';
      if (userAgent.indexOf('Android') !== -1) osVersion = 'Android';
      if (userAgent.indexOf('like Mac') !== -1) osVersion = 'iOS';

      // Simple browser detection
      if (userAgent.indexOf('Chrome') !== -1) deviceName = 'Chrome Browser';
      else if (userAgent.indexOf('Firefox') !== -1) deviceName = 'Firefox Browser';
      else if (userAgent.indexOf('Safari') !== -1) deviceName = 'Safari Browser';
      else if (userAgent.indexOf('Edge') !== -1) deviceName = 'Edge Browser';

      console.log('Registering device for push notifications with info:', { deviceName, osVersion });

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
      console.log('Device registered for push notifications with info:', { deviceName, osVersion });

    } catch (err) {
      console.error('Error registering device:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    if (isAuthenticated) {
      const setupNotifications = async () => {
        try {
          const token = await requestForToken();
          if (token) {
            setPermissionStatus('granted');
            await registerDevice(token);
          } else {
            // Re-check permission if token failed
            if ('Notification' in window) {
              setPermissionStatus(Notification.permission);
            }
          }
        } catch (error) {
          console.error('Error in setupNotifications:', error);
          if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
          }
        }
      };

      setupNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    onMessageListener().then((payload: any) => {
      toast.info(payload.notification.title, {
        description: payload.notification.body,
      });
      console.log('Message received in foreground:', payload);
    });
  }, []);

  return { permissionStatus };
};
