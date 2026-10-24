import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
    getUserLocation,
    subscribeUserLocation,
    updateUserLocation,
} from '@/lib/userLocationStore';

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

const getSnapshot = () => getUserLocation();
const getServerSnapshot = () => null;

/**
 * Geolocalización del usuario con persistencia (localStorage + TTL).
 * Si ya hay una ubicación vigente no vuelve a pedir permiso al navegador.
 * `city` llega desde el reverse geocoding (ver reverseGeocodeCity en utils/geo).
 */
export const useUserLocation = (options: UseUserLocationOptions = {}) => {
    const { enabled = true, timeout = 10000, maximumAge = 60000 } = options;
    const stored = useSyncExternalStore(subscribeUserLocation, getSnapshot, getServerSnapshot);
    const [status, setStatus] = useState<GeolocationStatus>(() => (stored ? 'granted' : 'idle'));
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
                updateUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
                setStatus('granted');
            },
            (err) => {
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
        if (stored) {
            setStatus('granted');
            return;
        }
        // 'idle' = aún no se intentó (evita reintentos tras denegar/error).
        if (status === 'idle') request();
    }, [enabled, stored, status, request]);

    const coords = useMemo<UserLocation | null>(
        () => (stored ? { lat: stored.lat, lng: stored.lng, accuracy: stored.accuracy } : null),
        [stored]
    );

    return { coords, city: stored?.city ?? null, status, error, request };
};
