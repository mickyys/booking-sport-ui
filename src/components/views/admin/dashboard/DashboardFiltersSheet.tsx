"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DashboardFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  code: string;
  status: string;
  onApply: (patch: { date: string; code: string; status?: string }) => void;
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/40';

export const DashboardFiltersSheet: React.FC<DashboardFiltersSheetProps> = ({
  open,
  onOpenChange,
  date,
  code,
  status,
  onApply,
}) => {
  const [from, to] = (date || '').split('|');
  const [draftFrom, setDraftFrom] = useState(from || '');
  const [draftTo, setDraftTo] = useState(to || '');
  const [draftCode, setDraftCode] = useState(code);
  const [expired, setExpired] = useState(status === 'expired');

  useEffect(() => {
    if (!open) return;
    const [f, t] = (date || '').split('|');
    setDraftFrom(f || '');
    setDraftTo(t || '');
    setDraftCode(code);
    setExpired(status === 'expired');
  }, [open, date, code, status]);

  const apply = () => {
    const patch: { date: string; code: string; status?: string } = {
      date: `${draftFrom}|${draftTo}`,
      code: draftCode,
    };
    if (expired) patch.status = 'expired';
    else if (status === 'expired') patch.status = '';
    onApply(patch);
    onOpenChange(false);
  };

  const clear = () => {
    onApply({ date: '|', code: '', status: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="dashboard-filters"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        <DialogHeader className="pr-9 text-left">
          <DialogTitle className="text-lg font-black text-slate-900">Filtros</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Filtra las reservas por fecha, código o estado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Desde</span>
            <input type="date" className={inputClass} value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Hasta</span>
            <input type="date" className={inputClass} value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Código de reserva</span>
          <input
            type="text"
            placeholder="Ej: ABC123"
            className={inputClass}
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
          />
        </label>

        <button
          type="button"
          aria-pressed={expired}
          onClick={() => setExpired((value) => !value)}
          className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition-colors ${
            expired
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Ver solo expiradas
        </button>

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
