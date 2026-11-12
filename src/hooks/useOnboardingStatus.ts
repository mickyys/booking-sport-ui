"use client";
import { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getOnboardingStatus, OnboardingStatus } from '../api/onboardingApi';

/** Estado del onboarding calculado por el backend (datos reales del centro). */
export const useOnboardingStatus = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      setIsLoading(true);
      setError(false);
      const token = await getAccessTokenSilently();
      const data = await getOnboardingStatus(token);
      setStatus(data);
      return data;
    } catch (e) {
      console.error('Error fetching onboarding status:', e);
      setError(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, isLoading, error, refresh };
};
