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
