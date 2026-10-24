"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Globe, Clock, Percent, AlertTriangle, CheckCircle, Info, CreditCard, Image as ImageIcon, X, Palette, Star, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { uploadImageToCloudinary } from '@/components/booking/CourtImageUpload';
import { LocationMapPicker } from '@/components/admin/LocationMapPicker';
import { MPOnlinePaymentCard } from '@/components/admin/MPOnlinePaymentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CenterTimeSlot } from '@/types';
import { platformDomain } from '@/utils/host';

interface AdminSettingsProps {
    sportCenter: any;
    onSave?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ sportCenter, onSave }) => {
    const [slug, setSlug] = useState('');
    const [cancellationHours, setCancellationHours] = useState<number>(3);
    const [retentionPercent, setRetentionPercent] = useState<number>(10);
    const [partialPaymentEnabled, setPartialPaymentEnabled] = useState<boolean>(false);
    const [partialPaymentPercent, setPartialPaymentPercent] = useState<number>(50);
    const [marketplaceFeePercent, setMarketplaceFeePercent] = useState<number>(7);
    const [isFeatured, setIsFeatured] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [defaultSchedule, setDefaultSchedule] = useState<CenterTimeSlot | null>(null);
    const [scheduleOverrides, setScheduleOverrides] = useState<Record<number, CenterTimeSlot>>({});
    const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [activeTab, setActiveTab] = useState('general');

    // Branding
    const [brandingName, setBrandingName] = useState('');
    const [brandingLogoUrl, setBrandingLogoUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#10b981');
    const [primaryDark, setPrimaryDark] = useState('#059669');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [navBg, setNavBg] = useState('#0f172a');
    const [heroGradient, setHeroGradient] = useState('');

    // Ubicación
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [googlePlaceId, setGooglePlaceId] = useState('');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const suggestionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { updateSportCenterSettings, fetchSportCenterByID, isLoading } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar 5MB');
            return;
        }
        setLocalImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setLocalImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setLocalImageFile(null);
        setLocalImagePreview(null);
    };

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const handleGeocode = async () => {
        if (!address.trim()) {
            toast.error('Ingresa una dirección primero');
            return;
        }
        if (!MAPBOX_TOKEN) {
            toast.error('NEXT_PUBLIC_MAPBOX_TOKEN no está configurado');
            return;
        }
        setIsGeocoding(true);
        try {
            const query = encodeURIComponent([address, city].filter(Boolean).join(', '));
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?limit=1&country=cl&access_token=${MAPBOX_TOKEN}`
            );
            const data = await res.json();
            const feature = data?.features?.[0];
            if (!feature) {
                toast.error('No se encontraron coordenadas para esa dirección');
                return;
            }
            const [lng, lat] = feature.center;
            setCoordinates({ lat, lng });
            toast.success('Coordenadas actualizadas');
        } catch (err) {
            console.error('Error geocoding address:', err);
            toast.error('Error al buscar coordenadas');
        } finally {
            setIsGeocoding(false);
        }
    };

    const fetchAddressSuggestions = async (query: string) => {
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&limit=5&country=cl&language=es&access_token=${MAPBOX_TOKEN}`
            );
            const data = await res.json();
            const features = data?.features || [];
            setAddressSuggestions(features);
            setShowAddressSuggestions(features.length > 0);
        } catch (err) {
            console.error('Error fetching address suggestions:', err);
        }
    };

    const handleAddressChange = (value: string) => {
        setAddress(value);
        if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
        if (!MAPBOX_TOKEN || value.trim().length < 4) {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
            return;
        }
        suggestionsDebounceRef.current = setTimeout(() => fetchAddressSuggestions(value.trim()), 300);
    };

    const handleSelectSuggestion = (feature: any) => {
        if (feature.place_name) setAddress(feature.place_name);
        const center = feature.center;
        if (Array.isArray(center) && center.length === 2) {
            setCoordinates({ lng: Number(center[0]) || 0, lat: Number(center[1]) || 0 });
        }
        const cityCtx = (feature.context || []).find((c: any) => String(c.id).startsWith('place.'));
        if (cityCtx?.text) setCity(cityCtx.text);
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        toast.success('Dirección seleccionada: coordenadas y ciudad actualizadas');
    };

    // Limpia el debounce de sugerencias al desmontar
    useEffect(() => {
        return () => {
            if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        const loadSportCenter = async () => {
            const id = sportCenter?.id || sportCenter?._id;
            if (!id) return;
            setLoadingData(true);
            try {
                const center = await fetchSportCenterByID(id, getAccessTokenSilently);
                if (center) {
                    setSlug(center.slug || '');
                    setCancellationHours(center.cancellation_hours ?? 3);
                    setRetentionPercent(center.retention_percent ?? 10);
                    setPartialPaymentEnabled(center.partialPaymentEnabled ?? false);
                    setPartialPaymentPercent(center.partialPaymentPercent ?? 50);
                    setMarketplaceFeePercent(center.marketplace_fee_percent ?? 7);
                    setIsFeatured(center.is_featured ?? false);
                    setImageUrl(center.image_url || '');
                    if (center.default_schedule) setDefaultSchedule(center.default_schedule);
                    if (center.schedule_overrides) setScheduleOverrides(center.schedule_overrides);
                    if (center.active_days) setActiveDays(center.active_days);

                    // Ubicación
                    setAddress(center.address || '');
                    setCity(center.city || '');
                    setGooglePlaceId(center.google_place_id || '');
                    const c = center.coordinates;
                    if (Array.isArray(c)) {
                        setCoordinates({ lng: Number(c[0]) || 0, lat: Number(c[1]) || 0 });
                    } else if (c && typeof c === 'object') {
                        setCoordinates({ lat: Number(c.lat) || 0, lng: Number(c.lng) || 0 });
                    }

                    if (center.branding) {
                        setBrandingName(center.branding.name || '');
                        setBrandingLogoUrl(center.branding.logo_url || '');
                        setPrimaryColor(center.branding.primary_color || '#10b981');
                        setPrimaryDark(center.branding.primary_dark || '#059669');
                        setAccentColor(center.branding.accent || '#6366f1');
                        setNavBg(center.branding.nav_bg || '#0f172a');
                        setHeroGradient(center.branding.hero_gradient || '');
                    }
                }
            } finally {
                setLoadingData(false);
            }
        };
        loadSportCenter();
    }, [sportCenter?.id, sportCenter?._id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sportCenter?.id && !sportCenter?._id) return;

        // Los campos de pestañas inactivas se desmontan, así que la validación
        // nativa `required` no se ejecuta. Validamos el slug explícitamente y
        // volvemos a la pestaña General para que el usuario pueda corregirlo.
        if (!slug.trim()) {
            toast.error('El subdominio (slug) es obligatorio');
            setActiveTab('general');
            return;
        }

        try {
            const id = sportCenter.id || sportCenter._id;
            let finalImageUrl = imageUrl;

            if (localImageFile) {
                setIsUploading(true);
                toast.info('Subiendo imagen...');
                finalImageUrl = await uploadImageToCloudinary(localImageFile);
            }

            await updateSportCenterSettings(id, {
                image_url: finalImageUrl,
                slug,
                cancellation_hours: cancellationHours,
                retention_percent: retentionPercent,
                partialPaymentEnabled: partialPaymentEnabled,
                partialPaymentPercent: partialPaymentPercent,
                marketplace_fee_percent: marketplaceFeePercent,
                is_featured: isFeatured,
                address,
                city,
                coordinates,
                google_place_id: googlePlaceId.trim(),
                branding: {
                    name: brandingName,
                    logo_url: brandingLogoUrl,
                    primary_color: primaryColor,
                    primary_dark: primaryDark,
                    accent: accentColor,
                    nav_bg: navBg,
                    hero_gradient: heroGradient,
                },
            }, getAccessTokenSilently);

            setLocalImageFile(null);
            setLocalImagePreview(null);
            setImageUrl(finalImageUrl);
            toast.success("Configuración actualizada con éxito");
            if (onSave) onSave();
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al actualizar la configuración");
        } finally {
            setIsUploading(false);
        }
    };

    if (!sportCenter) return <div className="p-8 text-center text-slate-500">No se encontró información del centro deportivo.</div>;
    if (loadingData) return <div className="flex justify-center p-8 text-slate-500">Cargando configuración...</div>;

    const refundPercent = 100 - retentionPercent;

    const daysOfWeek = [
        { label: 'Domingo', value: 0 },
        { label: 'Lunes', value: 1 },
        { label: 'Martes', value: 2 },
        { label: 'Miércoles', value: 3 },
        { label: 'Jueves', value: 4 },
        { label: 'Viernes', value: 5 },
        { label: 'Sábado', value: 6 },
    ];

    const toggleDay = (day: number) => {
        setActiveDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const settingsTabs = [
        { value: 'general', label: 'General', icon: Settings, description: 'Información pública y visibilidad del club.' },
        { value: 'ubicacion', label: 'Ubicación', icon: MapPin, description: 'Dirección, ciudad y ubicación en el mapa.' },
        { value: 'marca', label: 'Marca', icon: Palette, description: 'Logo, colores y apariencia de tu club.' },
        { value: 'reservas', label: 'Reservas', icon: Clock, description: 'Política de cancelación y devoluciones.' },
        { value: 'pagos', label: 'Pagos', icon: CreditCard, description: 'Mercado Pago, comisiones y abonos.' },
    ];

    const activeTabDescription = settingsTabs.find((tab) => tab.value === activeTab)?.description;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Configuración General del Club</h3>
                </div>

                <form onSubmit={handleSave}>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-slate-100 px-4 pt-4 sm:px-6">
                            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {settingsTabs.map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="h-auto flex-none gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm sm:text-sm"
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="px-5 py-6 sm:px-8">
                            <p className="mb-5 text-xs font-medium text-slate-500">{activeTabDescription}</p>

                            <TabsContent value="general" className="space-y-6 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Imagen del Club</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                            className="hidden"
                            id="club-image-upload"
                        />
                        {localImagePreview || imageUrl ? (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img src={localImagePreview || imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="club-image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
                                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Haz clic para subir una imagen</span>
                                <span className="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</span>
                            </label>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Subdominio (Slug)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Globe className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                                placeholder="ej: orellana"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500">
                            Esto se usará para acceder directamente via <span className="font-bold">{slug || 'tu-club'}.{platformDomain()}</span>
                        </p>
                    </div>

                    {/* Centro destacado */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-amber-500" />
                            <h4 className="text-base font-bold text-slate-900">Centro destacado</h4>
                        </div>
                        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isFeatured}
                                onClick={() => setIsFeatured(!isFeatured)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-0.5'}`}
                                />
                            </button>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {isFeatured ? 'Este centro aparece destacado' : 'Activar destacado'}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                    Los centros destacados aparecen primero en las búsquedas de su ciudad, por encima del orden por distancia.
                                </p>
                            </div>
                        </div>
                    </div>
                            </TabsContent>

                            <TabsContent value="ubicacion" className="space-y-6 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0">
                    {/* Ubicación */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h4 className="text-base font-bold text-slate-900">Ubicación</h4>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => handleAddressChange(e.target.value)}
                                        onFocus={() => { if (addressSuggestions.length > 0) setShowAddressSuggestions(true); }}
                                        onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && showAddressSuggestions && addressSuggestions.length > 0) {
                                                e.preventDefault();
                                                handleSelectSuggestion(addressSuggestions[0]);
                                            } else if (e.key === 'Escape') {
                                                setShowAddressSuggestions(false);
                                            }
                                        }}
                                        autoComplete="off"
                                        placeholder="Av. Providencia 1234"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                    />
                                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                            {addressSuggestions.map((f, i) => (
                                                <button
                                                    key={f.id || i}
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(f); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                                                >
                                                    <span className="block text-sm font-medium text-slate-800 truncate">{f.text}</span>
                                                    <span className="block text-xs text-slate-500 truncate">{f.place_name}</span>
                                                </button>
                                            ))}
                                            <p className="px-4 py-1.5 text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
                                                Sugerencias de Mapbox · Enter selecciona la primera
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Santiago"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="google-place-id" className="block text-sm font-medium text-slate-700 mb-1">
                                    Google Place ID (reseñas)
                                </label>
                                <input
                                    id="google-place-id"
                                    type="text"
                                    value={googlePlaceId}
                                    onChange={(e) => setGooglePlaceId(e.target.value)}
                                    placeholder="ChIJ..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Muestra la calificación y reseñas de Google en tu página. Búscalo en el{' '}
                                    <a
                                        href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline"
                                    >
                                        buscador de Place ID
                                    </a>
                                    . Déjalo vacío para ocultar las reseñas.
                                </p>
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={handleGeocode}
                                    disabled={isGeocoding || !address.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeocoding ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <MapPin className="w-4 h-4" />
                                    )}
                                    {isGeocoding ? 'Buscando...' : 'Buscar coordenadas'}
                                </button>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Autocompleta latitud y longitud a partir de la dirección usando Mapbox.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={coordinates.lat || ''}
                                        onChange={(e) => setCoordinates((prev) => ({ ...prev, lat: Number(e.target.value) || 0 }))}
                                        placeholder="-33.5922"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={coordinates.lng || ''}
                                        onChange={(e) => setCoordinates((prev) => ({ ...prev, lng: Number(e.target.value) || 0 }))}
                                        placeholder="-71.6127"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <LocationMapPicker
                                value={coordinates}
                                onChange={(coords) => setCoordinates(coords)}
                            />

                            <p className="text-xs text-slate-500">
                                Las coordenadas se usan para mostrar el centro en el mapa y ordenar los resultados por cercanía.
                            </p>
                        </div>
                    </div>
                            </TabsContent>

                            <TabsContent value="marca" className="space-y-6 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0">
                    {/* Identidad de Marca */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="w-5 h-5 text-indigo-500" />
                            <h4 className="text-base font-bold text-slate-900">Identidad de Marca</h4>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de marca</label>
                                    <input
                                        type="text"
                                        value={brandingName}
                                        onChange={(e) => setBrandingName(e.target.value)}
                                        placeholder="Mi Centro Deportivo"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL del logo</label>
                                    <input
                                        type="url"
                                        value={brandingLogoUrl}
                                        onChange={(e) => setBrandingLogoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Color primario', value: primaryColor, set: setPrimaryColor },
                                    { label: 'Primario oscuro', value: primaryDark, set: setPrimaryDark },
                                    { label: 'Acento', value: accentColor, set: setAccentColor },
                                    { label: 'Navbar / Fondo', value: navBg, set: setNavBg },
                                ].map(({ label, value, set }) => (
                                    <div key={label}>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={value}
                                                onChange={(e) => set(e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => set(e.target.value)}
                                                className="w-full px-2 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Gradiente del hero (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={heroGradient}
                                    onChange={(e) => setHeroGradient(e.target.value)}
                                    placeholder="linear-gradient(to bottom, rgba(15,23,42,0.5), rgba(15,23,42,0.85))"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-xs font-mono"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Se usa sobre la imagen del hero. Si se deja vacío se usa el gradiente por defecto.
                                </p>
                            </div>

                            {/* Preview */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Vista previa</p>
                                <div className="flex items-center gap-3">
                                    {[
                                        { label: 'Primario', color: primaryColor },
                                        { label: 'Oscuro', color: primaryDark },
                                        { label: 'Acento', color: accentColor },
                                        { label: 'Navbar', color: navBg },
                                    ].map(({ label, color }) => (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 rounded-xl shadow-sm border border-slate-200" style={{ backgroundColor: color }} />
                                            <span className="text-[10px] text-slate-500">{label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="mt-3 rounded-xl px-4 py-3 text-white text-xs font-bold"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {brandingName || 'Mi Centro Deportivo'} — botón principal
                                </div>
                            </div>
                        </div>
                    </div>
                            </TabsContent>

                            <TabsContent value="reservas" className="space-y-6 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0">
                    {/* Cancellation Policy */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h4 className="text-base font-bold text-slate-900">Política de Cancelación y Devolución</h4>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Horas límite para devolución completa
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={168}
                                        value={cancellationHours}
                                        onChange={(e) => setCancellationHours(Math.max(0, Math.min(168, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">horas antes del partido</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Si el usuario cancela con {cancellationHours} horas o más de anticipación, recibirá el <strong>100%</strong> de devolución.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Percent className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Porcentaje de retención por cancelación tardía
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={retentionPercent}
                                        onChange={(e) => setRetentionPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">% de retención</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Si el usuario cancela con menos de {cancellationHours} horas, se retiene el <strong>{retentionPercent}%</strong> del pago {retentionPercent === 100 ? '(sin devolución)' : `y se devuelve el ${refundPercent}%`}.
                                </p>
                            </div>
                        </div>
                    </div>
                            </TabsContent>

                            <TabsContent value="pagos" className="space-y-6 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0">
                    {/* Mercado Pago / Cobro online */}
                    <MPOnlinePaymentCard />

                    {/* Mercado Pago Marketplace Fee */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Percent className="w-5 h-5 text-emerald-500" />
                            <h4 className="text-base font-bold text-slate-900">Comisión de Mercado Pago</h4>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Percent className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Porcentaje de comisión por reserva
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={marketplaceFeePercent}
                                        onChange={(e) => setMarketplaceFeePercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">% del pago</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Comisión que recibe la plataforma por cada pago procesado. Si no se configura, se usa el <strong>7%</strong> por defecto.
                                    Solo aplica cuando el cobro online con Mercado Pago está activo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Partial Payment */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            <h4 className="text-base font-bold text-slate-900">Pagos Parciales (Abonos)</h4>
                        </div>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-slate-900">Activar pagos parciales</label>
                                    <p className="text-xs text-slate-500">Los usuarios podrán elegir pagar un abono al reservar.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPartialPaymentEnabled(!partialPaymentEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${partialPaymentEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${partialPaymentEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Porcentaje de abono requerido
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min={1}
                                            max={99}
                                            value={partialPaymentPercent}
                                            onChange={(e) => setPartialPaymentPercent(Math.max(1, Math.min(99, Number(e.target.value))))}
                                            className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                        />
                                        <span className="text-sm text-slate-600">% del total</span>
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        El usuario pagará el {partialPaymentPercent}% al momento de reservar y el {100 - partialPaymentPercent}% restante en el club.
                                    </p>
                                </div>
                        </div>
                    </div>

                            </TabsContent>
                        </div>
                    </Tabs>

                    <div className="border-t border-slate-100 px-5 py-4 sm:px-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500">
                                Se guardan los cambios de todas las pestañas. Mercado Pago se guarda al instante.
                            </p>
                            <button
                                type="submit"
                                disabled={isLoading || isUploading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition-all hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 sm:w-auto sm:min-w-[190px]"
                            >
                                <Save className="w-5 h-5" />
                                {isLoading || isUploading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
