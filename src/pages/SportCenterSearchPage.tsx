import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import SearchHero from '../components/search/SearchHero';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import SportCenterCard from '../components/search/SportCenterCard';
import SearchFeatures from '../components/search/SearchFeatures';
import EmptySearchResults from '../components/search/EmptySearchResults';

const SportCenterSearchPage: React.FC = () => {
  const { sportCenters, isLoading, cities, fetchCities, fetchSportCenters } = useBookingStore();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  const availableHours = useMemo(() => {
    // Fixed hours from 6 (6AM) to 23 (11PM) in HH:MM format
    return Array.from({ length: 18 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      (selectedCity && selectedCity !== 'Todas') ||
      !!selectedHour ||
      !!searchTerm
    );
  }, [selectedCity, selectedHour, searchTerm]);

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
    const hourParam = selectedHour ? Number(selectedHour.split(':')[0]) : undefined;
    const cityParam = selectedCity && selectedCity !== 'Todas' ? selectedCity : undefined;

    fetchSportCenters?.({
      name: searchTerm || undefined,
      city: cityParam,
      date: selectedDate || undefined,
      hour: hourParam,
    });
  }, [searchTerm, selectedCity, selectedHour, selectedDate, fetchSportCenters]);

  if (isLoading && sportCenters.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Cargando centros deportivos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <SearchHero>
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <SearchFilters
            cities={cities}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            hours={availableHours}
            selectedHour={selectedHour}
            onHourChange={setSelectedHour}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            minDate={todayISO}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-10">
        {sportCenters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sportCenters.map((center, index) => (
              <SportCenterCard key={center.id} center={center} index={index} date={selectedDate} today={todayISO} />
            ))}
          </div>
        ) : (
          !isLoading && <EmptySearchResults />
        )}
      </div>

      <SearchFeatures />
    </div>
  );
};

export default SportCenterSearchPage;
