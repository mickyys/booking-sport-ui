"use client";
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Loader2, Search, MapPin, Calendar, X, Zap, Trophy, ArrowRight } from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import MarketplaceHero from '@/components/search/MarketplaceHero';
import TenantCard from '@/components/search/TenantCard';
import SearchFeatures from '@/components/search/SearchFeatures';
import EmptySearchResults from '@/components/search/EmptySearchResults';
import { addDaysToSantiagoKey, todaySantiagoKey } from '@/lib/santiago';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserLocation } from '@/hooks/useUserLocation';
import { reverseGeocodeCity } from '@/utils/geo';
import { updateUserLocation } from '@/lib/userLocationStore';

const NEARBY_RADIUS_KM = 20;
const NEARBY_LIMIT = 50;

const MarketplacePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sportCenters, isLoading, cities, usedRadiusFallback, fetchCities, fetchSportCenters } = useBookingStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const geoFetchedRef = useRef(false);
  const geoCityResolvedRef = useRef(false);
  const autoCityAppliedRef = useRef(false);
  const { coords, city: detectedCity } = useUserLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => todaySantiagoKey());
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync state with URL on mount
  useEffect(() => {
    const city = searchParams.get('city');
    const name = searchParams.get('name');
    const hour = searchParams.get('hour');
    const date = searchParams.get('date');

    if (city) setSelectedCity(city);
    if (name) {
      setSearchTerm(name);
      setDebouncedSearchTerm(name);
    }
    if (hour) setSelectedHour(hour);
    if (date) setSelectedDate(date);
  }, [searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setHasInteracted(true);
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value);
    setHasInteracted(true);
  }, []);

  const handleHourChange = useCallback((value: string) => {
    setSelectedHour(value);
    setHasInteracted(true);
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setSelectedDate(value);
    setHasInteracted(true);
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const todayISO = useMemo(() => todaySantiagoKey(), []);
  const maxDateISO = useMemo(() => addDaysToSantiagoKey(todaySantiagoKey(), 6), []);

  const availableHours = useMemo(
    () => Array.from({ length: 18 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`),
    []
  );

  const hasActiveFilters = useMemo(
    () =>
      (selectedCity && selectedCity !== 'Todas') ||
      !!selectedHour ||
      !!debouncedSearchTerm,
    [selectedCity, selectedHour, debouncedSearchTerm]
  );

  const clearFilters = useCallback(() => {
    setSelectedCity('Todas');
    setSelectedHour('');
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSelectedDate(todayISO);
    router.replace('/', { scroll: false });
  }, [todayISO, router]);

  // Reverse geocoding una sola vez: coords -> ciudad detectada (guardada en el store).
  useEffect(() => {
    if (!coords || geoCityResolvedRef.current) return;
    geoCityResolvedRef.current = true;
    if (detectedCity) return;
    let cancelled = false;
    reverseGeocodeCity(coords.lat, coords.lng).then((detected) => {
      if (!cancelled && detected) updateUserLocation({ city: detected });
    });
    return () => {
      cancelled = true;
    };
  }, [coords, detectedCity]);

  // Auto-selección de la ciudad detectada (solo si el usuario no eligió ni interactuó).
  useEffect(() => {
    if (autoCityAppliedRef.current) return;
    if (hasInteracted || (selectedCity && selectedCity !== 'Todas')) {
      autoCityAppliedRef.current = true;
      return;
    }
    if (!detectedCity || cities.length === 0) return;
    const match = cities.find((c) => c.toLowerCase() === detectedCity.toLowerCase());
    if (!match) return;
    autoCityAppliedRef.current = true;
    setSelectedCity(match);
    setHasInteracted(true);
  }, [detectedCity, cities, hasInteracted, selectedCity]);

  // Radio solo cerca del usuario: 'Todas' o la ciudad detectada; otras ciudades no llevan radio.
  const nearbyRadiusKm = useMemo(() => {
    if (!coords) return undefined;
    const cityFilter = selectedCity && selectedCity !== 'Todas' ? selectedCity : undefined;
    if (cityFilter && (!detectedCity || cityFilter.toLowerCase() !== detectedCity.toLowerCase())) {
      return undefined;
    }
    return NEARBY_RADIUS_KM;
  }, [coords, selectedCity, detectedCity]);

  // Initial fetch
  useEffect(() => {
    fetchCities?.();
  }, [fetchCities]);

  // Fetch when filters change
  useEffect(() => {
    if (!hasInteracted) return;

    const hourParam = selectedHour ? Number(selectedHour.split(':')[0]) : undefined;
    const cityParam = selectedCity && selectedCity !== 'Todas' ? selectedCity : undefined;

    fetchSportCenters?.({
      name: debouncedSearchTerm || undefined,
      city: cityParam,
      date: selectedDate || undefined,
      hour: hourParam,
      lat: coords?.lat,
      lng: coords?.lng,
      radius: nearbyRadiusKm,
      limit: NEARBY_LIMIT,
    });

    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('name', debouncedSearchTerm);
    if (selectedCity && selectedCity !== 'Todas') params.set('city', selectedCity);
    if (selectedHour) params.set('hour', selectedHour);
    if (selectedDate && selectedDate !== todayISO) params.set('date', selectedDate);

    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearchTerm, selectedCity, selectedHour, selectedDate, fetchSportCenters, hasInteracted, router, todayISO, coords, nearbyRadiusKm]);

  // Cuando se obtiene la geolocalización y no hay filtros activos, reordenar
  // los resultados por cercanía (el backend prioriza destacados de la ciudad).
  useEffect(() => {
    if (!coords || hasInteracted || geoFetchedRef.current) return;
    geoFetchedRef.current = true;
    fetchSportCenters?.({ lat: coords.lat, lng: coords.lng, radius: NEARBY_RADIUS_KM, limit: NEARBY_LIMIT });
  }, [coords, hasInteracted, fetchSportCenters]);

  const totalCourts = useMemo(
    () => sportCenters.reduce((acc, c) => acc + (c.courts ?? 0), 0),
    [sportCenters]
  );

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showInitialLoading = isLoading && sportCenters.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketplaceHero
        centers={sportCenters}
        centersCount={sportCenters.length}
        totalCourts={totalCourts}
        onCtaClick={scrollToSearch}
      />

      {/* Sticky search & filters */}
      <div ref={searchRef} className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar centro, ciudad o dirección..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setDebouncedSearchTerm(''); setHasInteracted(true); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-300 outline-none appearance-none cursor-pointer min-w-[150px] w-full"
              >
                <option value="Todas">Todas las ciudades</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Hour filter */}
            <div className="relative">
              <select
                value={selectedHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-300 outline-none appearance-none cursor-pointer min-w-[150px] w-full"
              >
                <option value="">Todos los horarios</option>
                {availableHours.map((h) => (
                  <option key={h} value={h}>{h} hrs</option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={todayISO}
                max={maxDateISO}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-300 outline-none cursor-pointer w-full"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">
                {sportCenters.length === 0 && !isLoading
                  ? 'Sin resultados'
                  : `${sportCenters.length} centro${sportCenters.length !== 1 ? 's' : ''} deportivo${sportCenters.length !== 1 ? 's' : ''}`}
              </h2>
              {detectedCity && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <MapPin className="w-3.5 h-3.5" />
                  Cerca de ti: {detectedCity}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Reserva y paga en minutos
            </p>
            {usedRadiusFallback && (
              <p className="text-xs text-amber-600 mt-1">
                No hay centros dentro de {NEARBY_RADIUS_KM} km; mostrando los más cercanos.
              </p>
            )}
          </div>
        </div>

        {sportCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sportCenters.filter((center) => !center.isPrivate).map((center, index) => (
              <TenantCard key={center.id} center={center} index={index} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!isLoading && <EmptySearchResults />}
          </AnimatePresence>
        )}

        {/* Loading overlay - only when searching with existing results */}
        {isLoading && sportCenters.length > 0 && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-600 font-medium">Buscando centros deportivos...</p>
            </div>
          </div>
        )}

        {/* Initial loading state */}
        {showInitialLoading && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Cargando centros deportivos...</p>
          </div>
        )}
      </div>

      <SearchFeatures />

      {/* Footer CTA — Register your center */}
      <div className="bg-slate-900 text-white py-16 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Para centros deportivos
          </div>
          <h2 className="text-4xl font-extrabold mb-4">¿Tienes un centro deportivo?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Únete a ReservaloYA y consigue tu propia página personalizada, sistema de reservas y pagos integrado. Configura tu identidad de marca y empieza a recibir reservas hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/contacto')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all"
            >
              Registrar mi Centro
            </button>
            {sportCenters.length > 0 && (
              <button
                onClick={() => router.push(`/${sportCenters[0].slug}`)}
                className="border border-slate-600 hover:border-slate-400 text-slate-300 font-bold py-4 px-8 rounded-full text-lg transition-all flex items-center gap-2"
              >
                Ver demo
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;