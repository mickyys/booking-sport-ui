import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getMPConnectStatus, getMPConnectAuthURL, disconnectMP } from '../api/mpConnectApi';
import { MPConnectStatus } from '../types';

export const useMPConnect = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [status, setStatus] = useState<MPConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const token = await getAccessTokenSilently();
      const data = await getMPConnectStatus(token);
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Error fetching MP connect status:', error);
      setStatus({ connected: false });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      const token = await getAccessTokenSilently();
      const { auth_url } = await getMPConnectAuthURL(token);
      if (auth_url) {
        window.location.href = auth_url;
      }
    } catch (error) {
      console.error('Error getting MP auth URL:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [getAccessTokenSilently, isConnecting]);

  const disconnect = useCallback(async () => {
    if (isDisconnecting) return;
    try {
      setIsDisconnecting(true);
      const token = await getAccessTokenSilently();
      await disconnectMP(token);
      setStatus({ connected: false });
      return true;
    } catch (error) {
      console.error('Error disconnecting MP:', error);
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, [getAccessTokenSilently, isDisconnecting]);

  return {
    status,
    isLoading,
    isConnecting,
    isDisconnecting,
    fetchStatus,
    connect,
    disconnect,
  };
};
