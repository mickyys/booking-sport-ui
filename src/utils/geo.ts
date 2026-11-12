export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Normaliza las coordenadas que puede enviar el backend:
 * - { lat, lng }
 * - GeoJSON [lng, lat]
 * - GeoJSON Point { type, coordinates: [lng, lat] }
 * Devuelve undefined si no son coordenadas reales (ausentes o {lat:0,lng:0}).
 */
export function normalizeCoordinates(raw: unknown): Coordinates | undefined {
  if (!raw) return undefined;

  let lat: number | undefined;
  let lng: number | undefined;

  if (Array.isArray(raw)) {
    lng = Number(raw[0]);
    lat = Number(raw[1]);
  } else if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const inner = Array.isArray(obj.coordinates) ? (obj.coordinates as unknown[]) : null;
    if (inner) {
      lng = Number(inner[0]);
      lat = Number(inner[1]);
    } else {
      lat = obj.lat != null ? Number(obj.lat) : undefined;
      lng = obj.lng != null ? Number(obj.lng) : undefined;
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  return { lat: lat as number, lng: lng as number };
}

/** Devuelve [lng, lat] listo para Mapbox, o undefined si no hay coordenadas válidas. */
export function getLngLat(coordinates?: unknown): [number, number] | undefined {
  const coords = normalizeCoordinates(coordinates);
  return coords ? [coords.lng, coords.lat] : undefined;
}

interface MapsTarget {
  name?: string;
  address?: string;
  city?: string;
  coordinates?: unknown;
}

/**
 * URL de Google Maps para trazar la ruta al lugar. En móvil abre la app y en
 * desktop una pestaña nueva. Si no hay coordenadas válidas hace fallback a la
 * búsqueda por nombre + dirección.
 */
export function googleMapsDirectionsUrl(target: MapsTarget): string {
  const lngLat = getLngLat(target.coordinates);
  if (lngLat) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lngLat[1]},${lngLat[0]}`;
  }
  const query = encodeURIComponent([target.name, target.address, target.city].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** URL de Google Maps que muestra el lugar (para compartir la ubicación). */
export function googleMapsPlaceUrl(target: MapsTarget): string {
  const lngLat = getLngLat(target.coordinates);
  const query = lngLat
    ? `${lngLat[1]},${lngLat[0]}`
    : encodeURIComponent([target.name, target.address, target.city].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

/**
 * Reverse geocoding: coordenadas -> ciudad (Chile). Devuelve null si Mapbox
 * no responde o no hay contexto de ciudad en el feature.
 */
export async function reverseGeocodeCity(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  if (!MAPBOX_TOKEN || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=cl&language=es&limit=1`,
      { signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = Array.isArray(data?.features) ? data.features[0] : undefined;
    if (!feature) return null;
    const cityContext = (feature.context ?? []).find(
      (c: { id?: string }) => typeof c?.id === 'string' && (c.id.startsWith('place.') || c.id.startsWith('locality.')),
    );
    const city = cityContext?.text ?? feature.text;
    return typeof city === 'string' && city.trim() ? city.trim() : null;
  } catch {
    return null;
  }
}

/** Distancia en kilómetros entre dos puntos (fórmula de haversine). */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
