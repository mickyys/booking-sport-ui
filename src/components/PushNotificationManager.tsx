'use client';

import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * PushNotificationManager handles the initialization of push notifications.
 * UI elements for blocked notifications have been removed as per user request.
 */
export function PushNotificationManager() {
  // We call the hook to ensure initialization logic runs
  usePushNotifications();
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated) {
    return null;
  }

  return null;
}
