"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, X, MapPin, Loader2, ChevronRight } from 'lucide-react';
import { SportCenter } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getLngLat, googleMapsDirectionsUrl } from '@/utils/geo';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const DEFAULT_CENTER: [number, number] = [-71.6127, -33.5922]; // Santiago

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDistance(km?: number): string {
    if (km == null) return '';
    return km < 1 ? `A ${Math.round(km * 1000)} m` : `A ${km.toFixed(1)} km`;
}

interface NearbyCentersMapProps {
    center: SportCenter;
}

/**
 * Muestra un mini mapa de la ubicación del centro en la tarjeta de Contacto y,
 * al abrirlo, un mapa con todos los centros deportivos cercanos donde cada uno
 * enlaza hacia su página pública (/{slug}).
 */
export const NearbyCentersMap: React.FC<NearbyCentersMapProps> = ({ center }) => {
    const { sportCenters, isLoading, fetchSportCenters } = useBookingStore();
    const { coords } = useUserLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const previewContainerRef = useRef<HTMLDivElement | null>(null);
    const previewMapRef = useRef<any>(null);
    const modalContainerRef = useRef<HTMLDivElement | null>(null);
    const modalMapRef = useRef<any>(null);
    const modalMarkersRef = useRef<any[]>([]);
    const geoFetchedRef = useRef(false);

    const currentCenterId = center.id;

    // ── Mini mapa de vista previa ──────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const container = previewContainerRef.current;
        if (!MAPBOX_TOKEN || !container || previewMapRef.current) return;
        (async () => {
            try {
                const mod = await import('mapbox-gl');
                const mapboxgl = mod.default || mod;
                if (cancelled) return;
                mapboxgl.accessToken = MAPBOX_TOKEN;
                const lngLat = getLngLat(center.coordinates) || DEFAULT_CENTER;
                previewMapRef.current = new mapboxgl.Map({
                    container: container,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: lngLat,
                    zoom: 14,
                    interactive: false,
                    attributionControl: false,
                });
                new mapboxgl.Marker({ color: '#10b981' }).setLngLat(lngLat).addTo(previewMapRef.current);
            } catch (err) {
                console.error('Preview map init error', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            try { previewMapRef.current?.remove(); } catch (e) {}
            previewMapRef.current = null;
            try { modalMapRef.current?.remove(); } catch (e) {}
            modalMapRef.current = null;
        };
    }, []);

    // ── Carga de centros (ordenados por cercanía cuando hay geolocalización)
    useEffect(() => {
        if (!isOpen) return;
        fetchSportCenters(coords ? { lat: coords.lat, lng: coords.lng } : undefined);
    }, [isOpen]);

    useEffect(() => {
        if (!coords || geoFetchedRef.current) return;
        geoFetchedRef.current = true;
        if (isOpen) fetchSportCenters({ lat: coords.lat, lng: coords.lng });
    }, [coords]);

    // ── Mapa del modal ─────────────────────────────────────────────────────
    const buildPopupHtml = useCallback(
        (c: SportCenter) => {
            const isCurrent = c.id === currentCenterId;
            const dist = formatDistance(c.distanceKm);
            return `
                <div style="min-width:190px">
                    ${isCurrent ? '<span style="display:inline-block;background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px;margin-bottom:4px">Este centro</span>' : ''}
                    <p style="font-weight:700;margin:0 0 2px;color:#0f172a">${escapeHtml(c.name)}</p>
                    <p style="font-size:12px;color:#64748b;margin:0 0 6px">${escapeHtml([c.city, c.address].filter(Boolean).join(', '))}${dist ? ` · ${dist}` : ''}</p>
                    <div style="display:flex;gap:12px;align-items:center">
                        <a href="/${escapeHtml(c.slug)}" style="color:${isCurrent ? '#059669' : '#2563eb'};font-weight:600;font-size:13px;text-decoration:none">Ver centro deportivo →</a>
                        <a href="${escapeHtml(googleMapsDirectionsUrl({ name: c.name, address: c.address, city: c.city, coordinates: c.coordinates }))}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;font-size:13px;text-decoration:none">Cómo llegar</a>
                    </div>
                </div>`;
        },
        [currentCenterId]
    );

    const renderMarkers = useCallback(
        async (map: any) => {
            const mod = await import('mapbox-gl');
            const mapboxgl = mod.default || mod;
            modalMarkersRef.current.forEach((m) => {
                try { m.remove(); } catch (e) {}
            });
            modalMarkersRef.current = [];
            const bounds = new mapboxgl.LngLatBounds();
            let hasPoints = false;

            const addMarker = (c: SportCenter, color: string) => {
                const lngLat = getLngLat(c.coordinates);
                if (!lngLat) return;
                const marker = new mapboxgl.Marker({ color })
                    .setLngLat(lngLat)
                    .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(buildPopupHtml(c)))
                    .addTo(map);
                modalMarkersRef.current.push(marker);
                bounds.extend(lngLat);
                hasPoints = true;
            };

            // El centro actual siempre se marca con sus propias coordenadas,
            // independiente de la lista paginada de centros cercanos.
            addMarker(center, '#10b981');
            sportCenters.forEach((c: SportCenter) => {
                if (c.id === currentCenterId) return;
                addMarker(c, '#475569');
            });
            if (coords) {
                const userLngLat: [number, number] = [coords.lng, coords.lat];
                bounds.extend(userLngLat);
                new mapboxgl.Marker({ color: '#2563eb' })
                    .setLngLat(userLngLat)
                    .addTo(map);
                hasPoints = true;
            }
            if (hasPoints && !bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 0 });
            }
        },
        [center, sportCenters, buildPopupHtml, coords]
    );

    useEffect(() => {
        if (!isOpen || !MAPBOX_TOKEN) return;
        let cancelled = false;
        setMapReady(false);
        (async () => {
            try {
                const mod = await import('mapbox-gl');
                const mapboxgl = mod.default || mod;
                mapboxgl.accessToken = MAPBOX_TOKEN;
                if (cancelled || !modalContainerRef.current) return;
                const map = new mapboxgl.Map({
                    container: modalContainerRef.current,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: getLngLat(center.coordinates) || DEFAULT_CENTER,
                    zoom: 12,
                });
                modalMapRef.current = map;
                await renderMarkers(map);
                if (!cancelled) setMapReady(true);
            } catch (err) {
                console.error('Modal map init error', err);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Re-renderizar marcadores cuando llegan los centros ya con el mapa abierto
    useEffect(() => {
        if (!isOpen || !modalMapRef.current || !mapReady) return;
        renderMarkers(modalMapRef.current);
    }, [sportCenters, mapReady]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    // Liberar el mapa del modal al cerrar
    useEffect(() => {
        if (isOpen) return;
        try { modalMapRef.current?.remove(); } catch (e) {}
        modalMapRef.current = null;
        modalMarkersRef.current = [];
    }, [isOpen]);

    const focusCenter = async (c: SportCenter) => {
        const map = modalMapRef.current;
        const lngLat = getLngLat(c.coordinates);
        if (!map || !lngLat) return;
        map.flyTo({ center: lngLat, zoom: 15, essential: true });
        const found = modalMarkersRef.current.find(
            (m) =>
                Math.abs(m.getLngLat().lng - lngLat[0]) < 1e-9 &&
                Math.abs(m.getLngLat().lat - lngLat[1]) < 1e-9
        );
        if (found) found.togglePopup();
    };

    return (
        <>
            {/* Vista previa del mapa */}
            {!MAPBOX_TOKEN ? (
                <p className="text-xs text-slate-400">Mapa no disponible (falta NEXT_PUBLIC_MAPBOX_TOKEN)</p>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="relative block w-full h-40 rounded-xl overflow-hidden border border-slate-200 group cursor-pointer"
                    aria-label="Ver mapa con centros deportivos cercanos"
                >
                    <div ref={previewContainerRef} className="absolute inset-0" />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-sm text-white text-xs font-semibold shadow group-hover:bg-slate-900 transition-colors">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Ver centros cercanos
                    </span>
                </button>
            )}

            {/* Modal con todos los centros cercanos */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mapa */}
                        <div className="relative flex-1 min-h-[300px] md:min-h-[520px] bg-slate-100">
                            <div ref={(el) => { modalContainerRef.current = el; }} className="absolute inset-0" />
                            {!MAPBOX_TOKEN && (
                                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                    <p className="text-sm text-slate-500">
                                        El mapa no está disponible. Usa la lista para ir a cada centro.
                                    </p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors"
                                aria-label="Cerrar mapa"
                            >
                                <X className="w-4 h-4 text-slate-600" />
                            </button>
                            {(isLoading || !mapReady) && MAPBOX_TOKEN && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white/95 rounded-full px-4 py-2 shadow flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        <span className="text-xs font-medium text-slate-600">Cargando centros...</span>
                                    </div>
                                </div>
                            )}
                            {coords && (
                                <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-full bg-white/95 shadow text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    Ordenados por cercanía a ti
                                </div>
                            )}
                        </div>

                        {/* Lista de centros */}
                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col max-h-[40vh] md:max-h-none">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900">Centros deportivos cercanos</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{sportCenters.length} centro(s) encontrados</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {sportCenters.length === 0 && !isLoading && (
                                    <p className="text-sm text-slate-400 p-3">No hay centros disponibles.</p>
                                )}
                                {sportCenters.map((c: SportCenter) => {
                                    const isCurrent = c.id === currentCenterId;
                                    return (
                                        <div
                                            key={c.id}
                                            className={`rounded-xl border p-3 transition-colors ${
                                                isCurrent ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => focusCenter(c)}
                                                    className="text-left min-w-0"
                                                >
                                                    <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{[c.city, c.address].filter(Boolean).join(', ')}</p>
                                                    {c.distanceKm != null && (
                                                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{formatDistance(c.distanceKm)}</p>
                                                    )}
                                                </button>
                                                {isCurrent && (
                                                    <span className="flex-shrink-0 text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                                                        Este centro
                                                    </span>
                                                )}
                                            </div>
                                            {!isCurrent && c.slug && (
                                                <a
                                                    href={`/${c.slug}`}
                                                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline"
                                                >
                                                    Ver centro deportivo
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NearbyCentersMap;
