// Persistencia de la ubicación del usuario (coords + ciudad detectada) en
// localStorage, con TTL para no reutilizar posiciones viejas.
//
// Es un "external store" mínimo (getState/subscribe) para poder usarlo con
// useSyncExternalStore desde useUserLocation. No usa Zustand porque no debe
// entrar en el persist parcial de useBookingStore.

export interface UserLocationState {
    lat: number;
    lng: number;
    accuracy?: number;
    /** Ciudad detectada vía reverse geocoding (Mapbox), si ya se resolvió. */
    city?: string;
    /** Epoch ms de la última actualización de coords. */
    updatedAt: number;
}

export const USER_LOCATION_STORAGE_KEY = 'reservaloya.user-location.v1';
export const USER_LOCATION_TTL_MS = 30 * 60 * 1000;

type Listener = () => void;

const listeners = new Set<Listener>();
// undefined = aún no se leyó de localStorage; null = no hay ubicación válida.
let cached: UserLocationState | null | undefined;

function isValidState(value: unknown): value is UserLocationState {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.lat === 'number' &&
        Number.isFinite(v.lat) &&
        typeof v.lng === 'number' &&
        Number.isFinite(v.lng) &&
        typeof v.updatedAt === 'number' &&
        Number.isFinite(v.updatedAt)
    );
}

function persist(state: UserLocationState | null) {
    if (typeof window === 'undefined') return;
    try {
        if (state) {
            window.localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(state));
        } else {
            window.localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
        }
    } catch {
        // localStorage lleno/bloqueado: seguimos solo en memoria.
    }
}

function load(): UserLocationState | null {
    if (cached !== undefined) return cached;
    if (typeof window === 'undefined') {
        cached = null;
        return null;
    }
    let next: UserLocationState | null = null;
    try {
        const raw = window.localStorage.getItem(USER_LOCATION_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (isValidState(parsed) && Date.now() - parsed.updatedAt <= USER_LOCATION_TTL_MS) {
                next = parsed;
            } else {
                window.localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
            }
        }
    } catch {
        next = null;
    }
    cached = next;
    return cached;
}

function notify() {
    listeners.forEach((listener) => listener());
}

/** Snapshot actual (o null si no hay ubicación vigente). */
export function getUserLocation(): UserLocationState | null {
    return load();
}

export function subscribeUserLocation(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Fusiona la ubicación con el estado actual. Requiere lat/lng (propios o ya
 * guardados): sin coordenadas no hay nada que persistir.
 */
export function updateUserLocation(patch: Partial<Omit<UserLocationState, 'updatedAt'>>): void {
    const current = load();
    const merged: UserLocationState = {
        lat: patch.lat ?? current?.lat ?? Number.NaN,
        lng: patch.lng ?? current?.lng ?? Number.NaN,
        accuracy: patch.accuracy ?? current?.accuracy,
        city: patch.city ?? current?.city,
        updatedAt: Date.now(),
    };
    if (!isValidState(merged)) return;
    cached = merged;
    persist(merged);
    notify();
}

/** Borra la ubicación persistida (nueva sesión / ubicación vencida). */
export function clearUserLocation(): void {
    if (cached === null) return;
    cached = null;
    persist(null);
    notify();
}
