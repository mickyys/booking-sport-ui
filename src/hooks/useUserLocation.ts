import { useState, useEffect, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface UseUserLocationOptions {
  enabled?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useUserLocation = (options: UseUserLocationOptions = {}) => {
  const { enabled = true, timeout = 10000, maximumAge = 60000 } = options;
  const [coords, setCoords] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      setError('Geolocalización no soportada por este navegador');
      return;
    }
    setStatus('loading');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus('granted');
      },
      (err) => {
        setCoords(null);
        if (err.code === 1) {
          setStatus('denied');
          setError('Permiso de ubicación denegado');
        } else {
          setStatus('error');
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge }
    );
  }, [timeout, maximumAge]);

  useEffect(() => {
    if (!enabled) return;
    request();
  }, [enabled, request]);

  return { coords, status, error, request };
};