"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import SearchHero from '@/components/search/SearchHero';
import SearchBar from '@/components/search/SearchBar';
import SearchFilters from '@/components/search/SearchFilters';
import SportCenterCard from '@/components/search/SportCenterCard';
import SearchFeatures from '@/components/search/SearchFeatures';
import EmptySearchResults from '@/components/search/EmptySearchResults';
import { ContactForm } from '@/components/ContactForm';
import { useRouter } from 'next/navigation';

const SportCenterSearchPage: React.FC = () => {
  const router = useRouter();
  const { sportCenters, isLoading, cities, fetchCities, fetchSportCenters } = useBookingStore();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setHasInteracted(true);
  }, []);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDateISO = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + 6);
    return max.toISOString().split('T')[0];
  }, []);

  const availableHours = useMemo(() => {
    // Fixed hours from 6 (6AM) to 23 (11PM) in HH:MM format
    return Array.from({ length: 18 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      (selectedCity && selectedCity !== 'Todas') ||
      !!selectedHour ||
      !!debouncedSearchTerm
    );
  }, [selectedCity, selectedHour, debouncedSearchTerm]);

  const clearFilters = useCallback(() => {
    setSelectedCity('Todas');
    setSelectedHour('');
    setSearchTerm('');
    setSelectedDate(todayISO);
    setShowFilters(false);
  }, [todayISO]);

  // Initial fetch
  useEffect(() => {
    fetchCities?.();
  }, [fetchCities]);

  // Fetch sport centers when filters change (server-side filtering)
  useEffect(() => {
    if (!hasInteracted) return;
    
    const hourParam = selectedHour ? Number(selectedHour.split(':')[0]) : undefined;
    const cityParam = selectedCity && selectedCity !== 'Todas' ? selectedCity : undefined;

    fetchSportCenters?.({
      name: searchTerm || undefined,
      city: cityParam,
      date: selectedDate || undefined,
      hour: hourParam,
    });
  }, [searchTerm, selectedCity, selectedHour, selectedDate, fetchSportCenters, hasInteracted]);

  const showInitialLoading = isLoading && sportCenters.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <SearchHero>
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <SearchFilters
            cities={cities}
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
            hours={availableHours}
            selectedHour={selectedHour}
            onHourChange={handleHourChange}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            minDate={todayISO}
            maxDate={maxDateISO}
            showMobileFilters={showFilters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </SearchBar>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Results counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-6"
          >
            <p className="text-slate-300 font-medium">
              {sportCenters.length === 0 ? (
                'No se encontraron centros deportivos'
              ) : sportCenters.length === 1 ? (
                '1 centro deportivo disponible'
              ) : (
                `${sportCenters.length} centros deportivos disponibles`
              )}
            </p>
          </motion.div>
        </div>
      </SearchHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-10 relative">
        {sportCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportCenters.filter(center => !center.isPrivate).map((center, index) => (
              <SportCenterCard key={center.id} center={center} index={index} date={selectedDate} today={todayISO} />
            ))}
          </div>
        ) : (
          !isLoading && <EmptySearchResults />
        )}
        
        {/* Loading overlay - only shown when searching with existing results */}
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
          <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Cargando centros deportivos...</p>
          </div>
        )}
      </div>

      <SearchFeatures />

                {/* Sección de Contacto para Centros Deportivos */}
                <section className="py-20 bg-slate-50 border-t border-slate-200" id="contacto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                ¿Eres dueño de un <span className="text-emerald-600">Centro Deportivo</span>?
                            </h2>
                            <p className="text-xl text-slate-600 leading-relaxed">
                                Únete a la red de complejos deportivos y simplifica tus reservas. Digitaliza tu agenda, recibe pagos online y llega a más jugadores.
                            </p>
                            <div className="pt-4">
                                <button
                                    onClick={() => router.push('/contacto')}
                                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-1"
                                >
                                    Contáctanos para unirte
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
    </div>
  );
};

export default SportCenterSearchPage;
