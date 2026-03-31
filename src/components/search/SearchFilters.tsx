import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  hours: string[];
  selectedHour: string;
  onHourChange: (hour: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate: string;
  showMobileFilters: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  cities,
  selectedCity,
  onCityChange,
  hours,
  selectedHour,
  onHourChange,
  selectedDate,
  onDateChange,
  minDate,
  showMobileFilters,
  hasActiveFilters,
  onClearFilters,
}) => {
  const cityOptions = ['Todas', ...cities];

  return (
    <div className="">
      {/* Inline filters (desktop) */}
      <div className="hidden md:flex gap-3 items-center justify-center w-full">
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
        >
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={selectedHour}
          onChange={(e) => onHourChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
        >
          <option value="">Todos los horarios</option>
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour} hrs
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer appearance-none"
        />
      </div>

      {/* Mobile filters panel */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
              >
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Horario disponible
              </label>
              <select
                value={selectedHour}
                onChange={(e) => onHourChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
              >
                <option value="">Todos los horarios</option>
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour} hrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white appearance-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-slate-200"
        >
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mx-auto"
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SearchFilters;
