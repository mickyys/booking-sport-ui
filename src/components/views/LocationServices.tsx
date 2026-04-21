"use client";
"use client";
import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Info, Car, ShowerHead, Clock, Phone, Mail, Maximize2, Minimize2 } from 'lucide-react';
// Usamos solo Google Maps ahora (SDK cargado dinámicamente)
import { useBookingStore } from '@/store/useBookingStore';
import { SportCenter } from '@/types';

interface LocationServicesProps {
    selectedCenter?: string | null;
}

export const LocationServices: React.FC<LocationServicesProps> = ({ selectedCenter = null }) => {

    const { sportCenters, fetchSportCenters, isLoading, error, selectedCenterId, setSelectedCenterId } = useBookingStore(state => state);
    const [sportCenter, setSportCenter] = useState<SportCenter>(); // For forcing re-render when sport centers are loaded, if needed

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const googleMapRef = useRef<any | null>(null);
    const googleMarkerRef = useRef<any | null>(null);

    // Load Google Maps SDK dynamically
    const loadGoogleMaps = (apiKey: string) => {
        return new Promise<void>((resolve, reject) => {
            if ((window as any).google && (window as any).google.maps) return resolve();
            const existing = document.querySelector(`script[data-google-maps]`);
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
                return;
            }
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.setAttribute('data-google-maps', 'true');
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
        });
    };

    const initGoogleMap = async () => {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) {
            console.warn('VITE_GOOGLE_MAPS_API_KEY not set');
            return;
        }
        try {
            await loadGoogleMaps(key);
            if (!mapContainerRef.current) return;
            const center = sportCenter?.coordinates ? { lat: sportCenter.coordinates.lat, lng: sportCenter.coordinates.lng } : { lat: -33.5922, lng: -71.6127 };
            const google = (window as any).google;
            googleMapRef.current = new google.maps.Map(mapContainerRef.current, {
                center,
                zoom: 15,
                disableDefaultUI: false
            });
            if (googleMarkerRef.current) googleMarkerRef.current.setMap(null);
            googleMarkerRef.current = new google.maps.Marker({ position: center, map: googleMapRef.current });
        } catch (err) {
            console.error('Google Maps init error', err);
        }
    };

    // initMapLibre removed — ahora usamos exclusivamente Google Maps

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

        // init Google Maps once when container is available
        if (mapContainerRef.current && !googleMapRef.current) {
            initGoogleMap();
        }

        return () => {
            // cleanup google maps
            try { if (googleMarkerRef.current) googleMarkerRef.current.setMap(null); } catch (e) {}
            googleMarkerRef.current = null;
            try { if (googleMapRef.current) googleMapRef.current = null; } catch (e) {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sportCenters]);

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

    // update center when sportCenter changes
    useEffect(() => {
        const defaultCenter: [number, number] = [-71.6127, -33.5922];
        const centerArr: [number, number] = sportCenter?.coordinates
            ? [sportCenter.coordinates.lng, sportCenter.coordinates.lat]
            : defaultCenter;

        const google = (window as any).google;
        if (google && googleMapRef.current) {
            const center = { lat: centerArr[1], lng: centerArr[0] };
            try { googleMapRef.current.panTo(center); googleMapRef.current.setZoom(15); } catch (e) {}
            if (googleMarkerRef.current) googleMarkerRef.current.setPosition(center);
            else googleMarkerRef.current = new google.maps.Marker({ position: center, map: googleMapRef.current });
        } else {
            // si no está inicializado, inicializa Google Maps automáticamente
            initGoogleMap();
        }
    }, [sportCenter]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Ubicación y Servicios</h2>

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
