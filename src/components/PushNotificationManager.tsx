'use client';

import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * PushNotificationManager handles the initialization of push notifications.
 * UI elements for blocked notifications have been removed as per user request.
 */
export function PushNotificationManager() {
  // We call the hook to ensure initialization logic runs
  console.log('[PushNotificationManager] Rendering...');
  const { isAuthenticated } = useAuth0();
  console.log('[PushNotificationManager] isAuthenticated:', isAuthenticated);
  
  usePushNotifications();
  
  console.log('[PushNotificationManager] usePushNotifications called');

  if (!isAuthenticated) {
    console.log('[PushNotificationManager] Not authenticated, returning null');
    return null;
  }

  console.log('[PushNotificationManager] Authenticated, still returning null (no UI)');
  return null;
}
