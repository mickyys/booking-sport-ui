import { useCallback, useEffect, useState } from 'react';

/** 0 = sin radio (ver todos los centros, ordenados por cercanía). */
export const NO_RADIUS = 0;
export const NEARBY_RADIUS_OPTIONS_KM = [5, 10, 20, 40, 100, NO_RADIUS] as const;
export const DEFAULT_NEARBY_RADIUS_KM = 20;
export const NEARBY_RADIUS_STORAGE_KEY = 'reservaloya.nearby-radius-km.v1';

const isValidRadius = (value: number) =>
    (NEARBY_RADIUS_OPTIONS_KM as readonly number[]).includes(value);

/** Radio de búsqueda (km) elegido por el usuario, persistido en localStorage. */
export const useNearbyRadius = () => {
    const [radiusKm, setRadiusKmState] = useState<number>(DEFAULT_NEARBY_RADIUS_KM);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(NEARBY_RADIUS_STORAGE_KEY);
            const parsed = raw ? Number(raw) : Number.NaN;
            if (isValidRadius(parsed)) setRadiusKmState(parsed);
        } catch {
            // localStorage bloqueado: usamos el valor por defecto.
        }
        setReady(true);
    }, []);

    const setRadiusKm = useCallback((value: number) => {
        if (!isValidRadius(value)) return;
        setRadiusKmState(value);
        try {
            window.localStorage.setItem(NEARBY_RADIUS_STORAGE_KEY, String(value));
        } catch {
            // ignorado
        }
    }, []);

    return { radiusKm, setRadiusKm, ready };
};
