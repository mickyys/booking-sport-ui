"use client";

import React from 'react';
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Repeat,
  Search,
  X,
} from 'lucide-react';
import {
  CourtFilter,
  DayFilter,
  RecurringFilters,
  RecurringTab,
  WEEKDAY_CHIPS,
  hasActiveFilters,
} from './recurringUtils';

interface RecurringToolbarProps {
  filters: RecurringFilters;
  counts: { active: number; weekly: number; series: number; finished: number };
  courts: { id: string; name: string }[];
  refreshing: boolean;
  onChange: (patch: Partial<RecurringFilters>) => void;
  onRefresh: () => void;
  onClear: () => void;
}

const TABS: { key: RecurringTab; label: string; icon: React.ElementType }[] = [
  { key: 'active', label: 'Activas', icon: Repeat },
  { key: 'weekly', label: 'Indefinidas', icon: Repeat },
  { key: 'series', label: 'Series', icon: CalendarRange },
  { key: 'finished', label: 'Finalizadas', icon: CheckCircle2 },
];

const tabCount = (key: RecurringTab, counts: RecurringToolbarProps['counts']): number => {
  if (key === 'weekly') return counts.weekly;
  if (key === 'series') return counts.series;
  if (key === 'finished') return counts.finished;
  return counts.active;
};

export const RecurringToolbar: React.FC<RecurringToolbarProps> = ({
  filters,
  counts,
  courts,
  refreshing,
  onChange,
  onRefresh,
  onClear,
}) => {
  const clearable = hasActiveFilters(filters) || filters.tab !== 'active';

  return (
    <div
      data-testid="recurring-toolbar"
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 md:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filtrar por tipo de recurrencia"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {TABS.map((tab) => {
            const isActive = filters.tab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange({ tab: tab.key })}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-colors ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                {tab.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tabCount(tab.key, counts)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {clearable && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              <X size={14} />
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Actualizar reservas recurrentes"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-50 lg:flex-none"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualizando' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row xl:max-w-xl xl:flex-1">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.query}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="Buscar por cliente, teléfono o cancha..."
              aria-label="Buscar recurrencias por cliente, teléfono o cancha"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </div>

          <div className="relative sm:w-56">
            <select
              value={filters.courtId}
              onChange={(event) => onChange({ courtId: event.target.value as CourtFilter })}
              aria-label="Filtrar por cancha"
              className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="all">Todas las canchas</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          <button
            type="button"
            onClick={() => onChange({ dayIndex: 'all' })}
            aria-pressed={filters.dayIndex === 'all'}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
              filters.dayIndex === 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          {WEEKDAY_CHIPS.map((day) => {
            const isActive = filters.dayIndex === day.index;
            return (
              <button
                key={day.index}
                type="button"
                onClick={() => onChange({ dayIndex: day.index as DayFilter })}
                aria-pressed={isActive}
                aria-label={day.label}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
