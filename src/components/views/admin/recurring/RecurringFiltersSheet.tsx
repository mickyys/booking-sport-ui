"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CourtFilter, DayFilter, WEEKDAY_CHIPS } from './recurringUtils';

interface RecurringFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: { id: string; name: string }[];
  courtId: CourtFilter;
  dayIndex: DayFilter;
  onApply: (patch: { courtId: CourtFilter; dayIndex: DayFilter }) => void;
}

const chipClass = (active: boolean) =>
  `inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors ${
    active
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
  }`;

export const RecurringFiltersSheet: React.FC<RecurringFiltersSheetProps> = ({
  open,
  onOpenChange,
  courts,
  courtId,
  dayIndex,
  onApply,
}) => {
  const [draftCourt, setDraftCourt] = useState<CourtFilter>(courtId);
  const [draftDay, setDraftDay] = useState<DayFilter>(dayIndex);

  useEffect(() => {
    if (open) {
      setDraftCourt(courtId);
      setDraftDay(dayIndex);
    }
  }, [open, courtId, dayIndex]);

  const apply = () => {
    onApply({ courtId: draftCourt, dayIndex: draftDay });
    onOpenChange(false);
  };

  const clear = () => {
    onApply({ courtId: 'all', dayIndex: 'all' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="recurring-filters"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        <DialogHeader className="pr-9 text-left">
          <DialogTitle className="text-lg font-black text-slate-900">Filtros</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Filtra las reservas fijas por cancha o día.
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Cancha</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={draftCourt === 'all'} onClick={() => setDraftCourt('all')} className={chipClass(draftCourt === 'all')}>
              Todas
            </button>
            {courts.map((court) => (
              <button
                key={court.id}
                type="button"
                aria-pressed={draftCourt === court.id}
                onClick={() => setDraftCourt(court.id)}
                className={`${chipClass(draftCourt === court.id)} truncate`}
              >
                <span className="truncate">{court.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Día</p>
          <div className="grid grid-cols-4 gap-2">
            <button type="button" aria-pressed={draftDay === 'all'} onClick={() => setDraftDay('all')} className={chipClass(draftDay === 'all')}>
              Todos
            </button>
            {WEEKDAY_CHIPS.map((day) => (
              <button
                key={day.index}
                type="button"
                aria-pressed={draftDay === day.index}
                aria-label={day.label}
                onClick={() => setDraftDay(day.index)}
                className={chipClass(draftDay === day.index)}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={clear}
            className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={apply}
            className="min-h-11 flex-1 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
          >
            Aplicar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
