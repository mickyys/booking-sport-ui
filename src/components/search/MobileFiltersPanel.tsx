"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Zap, Clock } from 'lucide-react';

export interface MobileFiltersValues {
  city: string;
  radiusKm: number;
  hour: string;
  date: string;
}

interface MobileFiltersPanelProps {
  id: string;
  values: MobileFiltersValues;
  cities: string[];
  hours: string[];
  radiusOptions?: number[];
  noRadius: number;
  minDate: string;
  maxDate: string;
  todayDate: string;
  onApply: (values: MobileFiltersValues) => void;
  onClose: () => void;
}

const fieldClass =
  'w-full pl-10 pr-8 py-3 min-h-11 rounded-xl border border-slate-200 bg-slate-50 text-base focus:ring-2 focus:ring-emerald-300 outline-none appearance-none';

const MobileFiltersPanel: React.FC<MobileFiltersPanelProps> = ({
  id,
  values,
  cities,
  hours,
  radiusOptions,
  noRadius,
  minDate,
  maxDate,
  todayDate,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<MobileFiltersValues>(values);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clear = () =>
    setDraft({ city: 'Todas', radiusKm: values.radiusKm, hour: '', date: todayDate });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        className="md:hidden absolute top-full left-0 right-0 h-screen bg-slate-900/40"
      />
      <motion.div
        id={id}
        role="dialog"
        aria-label="Filtros de búsqueda"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg max-h-[70vh] overflow-y-auto"
      >
        <div className="px-4 py-4 space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Ciudad</span>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                className={fieldClass}
              >
                <option value="Todas">Todas las ciudades</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </label>

          {radiusOptions && (
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Radio de búsqueda</span>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={draft.radiusKm}
                  onChange={(e) => setDraft({ ...draft, radiusKm: Number(e.target.value) })}
                  className={fieldClass}
                >
                  {radiusOptions.map((km) => (
                    <option key={km} value={km}>
                      {km === noRadius ? 'Sin radio (todas)' : `Radio: ${km} km`}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          )}

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Horario</span>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={draft.hour}
                onChange={(e) => setDraft({ ...draft, hour: e.target.value })}
                className={fieldClass}
              >
                <option value="">Todos los horarios</option>
                {hours.map((h) => (
                  <option key={h} value={h}>{h} hrs</option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Fecha</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={draft.date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={fieldClass}
              />
            </div>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={clear}
            className="flex-1 min-h-11 rounded-xl border border-slate-200 text-slate-700 font-medium"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            Aplicar
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default MobileFiltersPanel;
