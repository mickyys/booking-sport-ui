"use client";
"use client";
import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Info, Car, ShowerHead, Clock, Phone, Mail, Maximize2, Minimize2 } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useBookingStore } from '@/store/useBookingStore';
import { SportCenter } from '@/types';
import { useUserLocation } from '@/hooks/useUserLocation';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LocationServicesProps {
    selectedCenter?: string | null;
}

export const LocationServices: React.FC<LocationServicesProps> = ({ selectedCenter = null }) => {

    const { sportCenters, fetchSportCenters, isLoading, error, selectedCenterId, setSelectedCenterId } = useBookingStore(state => state);
    const [sportCenter, setSportCenter] = useState<SportCenter>(); // For forcing re-render when sport centers are loaded, if needed

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const mapboxglRef = useRef<any | null>(null);
    const mapRef = useRef<any | null>(null);
    const centerMarkerRef = useRef<any | null>(null);
    const userMarkerRef = useRef<any | null>(null);
    const geoFetchedRef = useRef(false);
    const mapInitStartedRef = useRef(false);
    const sportCenterRef = useRef<SportCenter | undefined>(undefined);
    const { coords, status } = useUserLocation();

    useEffect(() => {
        sportCenterRef.current = sportCenter;
    }, [sportCenter]);

    const getDefaultCenter = (): [number, number] => {
        const sc = sportCenterRef.current;
        if (sc?.coordinates) return [sc.coordinates.lng, sc.coordinates.lat];
        return [-71.6127, -33.5922]; // Santiago
    };

    // Inicializa el mapa de Mapbox una sola vez.
    const initMapbox = async () => {
        if (mapInitStartedRef.current) return;
        mapInitStartedRef.current = true;
        if (!MAPBOX_TOKEN) {
            console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not set');
            return;
        }
        try {
            const mod = await import('mapbox-gl');
            const mapboxgl = mod.default || mod;
            mapboxgl.accessToken = MAPBOX_TOKEN;
            if (!mapContainerRef.current || mapRef.current) return;
            mapboxglRef.current = mapboxgl;
            const center = getDefaultCenter();
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center,
                zoom: 15,
            });
            centerMarkerRef.current = new mapboxgl.Marker({ color: '#10b981' })
                .setLngLat(center)
                .addTo(mapRef.current);
        } catch (err) {
            console.error('Mapbox init error', err);
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    useEffect(() => {
        if (!sportCenters || sportCenters.length === 0) {
            fetchSportCenters();
        }

        // si el usuario viene con un centro seleccionado por prop, respetarlo
        if (selectedCenter) {
            setSelectedCenterId(selectedCenter);
        }

        // si solo hay un centro, auto-seleccionarlo
        if (sportCenters && sportCenters.length === 1 && !selectedCenterId) {
            setSelectedCenterId(sportCenters[0].id);
        }

        // init Mapbox once when container is available
        if (mapContainerRef.current && !mapRef.current) {
            initMapbox();
        }

        return () => {
            // cleanup mapbox on unmount
            try { if (centerMarkerRef.current) centerMarkerRef.current.remove(); } catch (e) {}
            centerMarkerRef.current = null;
            try { if (userMarkerRef.current) userMarkerRef.current.remove(); } catch (e) {}
            userMarkerRef.current = null;
            try { if (mapRef.current) mapRef.current.remove(); } catch (e) {}
            mapRef.current = null;
            mapInitStartedRef.current = false;
            mapboxglRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sportCenters]);

    // Cuando se obtiene la geolocalización, reordenar los centros por cercanía
    // (el backend prioriza destacados de la ciudad y luego distancia).
    useEffect(() => {
        if (!coords || geoFetchedRef.current) return;
        geoFetchedRef.current = true;
        fetchSportCenters({ lat: coords.lat, lng: coords.lng });
    }, [coords, fetchSportCenters]);

    // Marcar la ubicación del usuario en el mapa.
    useEffect(() => {
        const mapboxgl = mapboxglRef.current;
        const map = mapRef.current;
        if (!mapboxgl || !map || !coords) return;
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map);
        return () => {
            try { if (userMarkerRef.current) userMarkerRef.current.remove(); } catch (e) {}
            userMarkerRef.current = null;
        };
    }, [coords, sportCenter]);

    // sincronizar sportCenter local con selectedCenterId del store
    useEffect(() => {
        if (selectedCenterId && sportCenters && sportCenters.length > 0) {
            const found = sportCenters.find(s => s.id === selectedCenterId);
            if (found) setSportCenter(found);
        }
        // si no hay selectedCenterId pero sportCenters tiene 1, seleccionar
        if (!selectedCenterId && sportCenters && sportCenters.length === 1) {
            setSelectedCenterId(sportCenters[0].id);
            setSportCenter(sportCenters[0]);
        }
    }, [selectedCenterId, sportCenters, setSelectedCenterId]);

    // Mover el mapa y el marcador al centro seleccionado
    useEffect(() => {
        const map = mapRef.current;
        const sc = sportCenterRef.current;
        if (!map || !sc?.coordinates) return;
        const center: [number, number] = [sc.coordinates.lng, sc.coordinates.lat];
        map.flyTo({ center, zoom: 15, essential: true });
        if (centerMarkerRef.current) centerMarkerRef.current.setLngLat(center);
    }, [sportCenter]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Ubicación y Servicios</h2>

            {status === 'loading' && (
                <p className="text-center text-sm text-slate-500 mb-4">Detectando tu ubicación para ordenar por cercanía...</p>
            )}
            {status === 'granted' && coords && (
                <p className="text-center text-sm text-emerald-600 mb-4">Mostrando centros ordenados por cercanía a tu ubicación</p>
            )}
            {(status === 'denied' || status === 'unsupported' || status === 'error') && (
                <p className="text-center text-sm text-slate-400 mb-4">Mostrando todos los centros</p>
            )}

            {/* Center Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {sportCenters.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSportCenter(c)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${(sportCenter?.id || '') === c.id
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                            }`}
                    >
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {c.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MapPin className="text-emerald-500" />
                        Cómo llegar
                    </h3>
                    <p className="text-slate-600 mb-4">
                        {isLoading ? 'Cargando dirección...' : (sportCenter?.address || '')}
                    </p>
                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                            <MapPin className="w-12 h-12 mb-2 opacity-20" />
                            <span className="sr-only">Mapa de ubicación</span>
                        </div>
                        <div id="map" ref={(el) => { mapContainerRef.current = el; }} className="w-full h-full" />
                        <div className={`${isFullScreen ? 'fixed bottom-4 right-4' : 'absolute bottom-3 right-3'} z-50`}>
                            <button
                                type="button"
                                aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                                onClick={() => {
                                    const el = mapContainerRef.current as any;
                                    if (!document.fullscreenElement) {
                                        if (el?.requestFullscreen) el.requestFullscreen();
                                        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
                                    } else {
                                        if (document.exitFullscreen) document.exitFullscreen();
                                        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
                                    }
                                }}
                                className="bg-white text-slate-700 p-2 rounded-full shadow-sm hover:bg-slate-50"
                            >
                                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Info className="text-emerald-500" />
                            Servicios Incluidos
                        </h3>
                        <ul className="space-y-4">
                            {(sportCenter?.services && sportCenter.services.length > 0) && (
                                sportCenter.services.map((s, idx) => {
                                    const label = s;
                                    let Icon = Info;
                                    const l = s.toLowerCase();
                                    if (l.includes('estacion')) Icon = Car;
                                    else if (l.includes('duch') || l.includes('camar')) Icon = ShowerHead;
                                    else if (l.includes('horar') || l.includes('turno')) Icon = Clock;

                                    return (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-bold block text-slate-900">{label}</span>
                                            </div>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>

                    {sportCenter?.contact && (
                        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
                            <h3 className="text-xl font-bold mb-4">Contacto</h3>
                            <div className="space-y-3">
                                <p className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-emerald-400" />
                                    <span>{sportCenter.contact.phone}</span>
                                </p>
                                <p className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-emerald-400" />
                                    <span>{sportCenter.contact.email}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default LocationServices;