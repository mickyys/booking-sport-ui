"use client";

import React, { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const DEFAULT_CENTER: [number, number] = [-71.6127, -33.5922]; // Santiago

interface Coordinates {
    lat: number;
    lng: number;
}

interface LocationMapPickerProps {
    value: Coordinates;
    onChange: (value: Coordinates) => void;
}

/**
 * Selector interactivo de coordenadas: clic en el mapa o arrastre del pin
 * actualiza la posición del centro deportivo.
 */
export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ value, onChange }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const mapboxglRef = useRef<any>(null);
    const lastEmittedRef = useRef<string>('');
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const placeMarker = (lng: number, lat: number) => {
        const mapboxgl = mapboxglRef.current;
        const map = mapRef.current;
        if (!map || !mapboxgl) return;
        if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({ color: '#10b981', draggable: true })
                .setLngLat([lng, lat])
                .addTo(map);
            markerRef.current.on('dragend', () => {
                const pos = markerRef.current.getLngLat();
                lastEmittedRef.current = `${pos.lat},${pos.lng}`;
                onChangeRef.current({ lat: pos.lat, lng: pos.lng });
            });
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const container = containerRef.current;
        if (!MAPBOX_TOKEN || !container || mapRef.current) return;
        (async () => {
            try {
                const mod = await import('mapbox-gl');
                const mapboxgl = mod.default || mod;
                if (cancelled || !container) return;
                mapboxgl.accessToken = MAPBOX_TOKEN;
                mapboxglRef.current = mapboxgl;
                const hasCoords = !!(value.lng || value.lat);
                const initial: [number, number] = hasCoords ? [value.lng, value.lat] : DEFAULT_CENTER;
                const map = new mapboxgl.Map({
                    container,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: initial,
                    zoom: hasCoords ? 15 : 9,
                });
                mapRef.current = map;
                map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

                if (hasCoords) placeMarker(value.lng, value.lat);

                map.on('click', (e: any) => {
                    const { lng, lat } = e.lngLat;
                    placeMarker(lng, lat);
                    lastEmittedRef.current = `${lat},${lng}`;
                    onChangeRef.current({ lat, lng });
                });
            } catch (err) {
                console.error('LocationMapPicker init error', err);
            }
        })();
        return () => {
            cancelled = true;
            try { mapRef.current?.remove(); } catch (e) {}
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sincroniza cambios externos (geocoding / inputs numéricos)
    useEffect(() => {
        const key = `${value.lat},${value.lng}`;
        if (!value.lat && !value.lng) return;
        if (key === lastEmittedRef.current) return;
        const map = mapRef.current;
        if (!map) return;
        placeMarker(value.lng, value.lat);
        map.flyTo({ center: [value.lng, value.lat], zoom: Math.max(map.getZoom(), 15), essential: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.lat, value.lng]);

    if (!MAPBOX_TOKEN) {
        return (
            <p className="text-xs text-slate-400">
                Selector de mapa no disponible (falta NEXT_PUBLIC_MAPBOX_TOKEN). Usa latitud y longitud manualmente.
            </p>
        );
    }

    return (
        <div>
            <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                <div ref={containerRef} className="w-full h-full" />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
                Haz clic en el mapa o arrastra el pin verde para ajustar la ubicación exacta del club.
            </p>
        </div>
    );
};

export default LocationMapPicker;
