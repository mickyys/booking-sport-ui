"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Copy, X } from 'lucide-react';
import { Space, SpaceCategory } from '@/types';

const CATEGORY_LABEL: Record<SpaceCategory, string> = {
  cancha: 'Cancha',
  quincho: 'Quincho',
  sede: 'Sede',
  piscina: 'Piscina',
};

interface CopyScheduleDialogProps {
  open: boolean;
  sourceSpace: Space;
  spaces: Space[];
  onClose: () => void;
  onCopy: (targetIds: string[]) => Promise<void>;
  copying: boolean;
}

export const CopyScheduleDialog: React.FC<CopyScheduleDialogProps> = ({
  open,
  sourceSpace,
  spaces,
  onClose,
  onCopy,
  copying,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const targets = useMemo(
    () => spaces.filter((space) => space.id !== sourceSpace.id && space.category === sourceSpace.category),
    [spaces, sourceSpace.id, sourceSpace.category],
  );

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isCancha = sourceSpace.category === 'cancha';

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Copiar horario</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Desde {sourceSpace.name}</h3>
            <p className="text-sm text-slate-500">
              Solo se puede copiar a espacios de la misma categoría ({CATEGORY_LABEL[sourceSpace.category]}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 space-y-4">
          {targets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-bold text-slate-600">No hay otros espacios de esta categoría.</p>
              <p className="text-xs text-slate-400 mt-1">Crea otro espacio para poder copiar su horario.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Destinos</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(targets.map((space) => space.id))}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Todos
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {targets.map((space) => {
                  const checked = selected.includes(space.id);
                  return (
                    <label
                      key={space.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        checked ? 'border-blue-300 bg-blue-50/70' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSelected((prev) =>
                            event.target.checked
                              ? [...prev, space.id]
                              : prev.filter((id) => id !== space.id),
                          );
                        }}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-800">{space.name}</span>
                        <span className="block text-xs text-slate-400">Se reemplazará su horario actual</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <p className="font-black uppercase tracking-wide text-[10px] text-amber-700">Importante</p>
                <p className="mt-1">
                  Se reemplazará el horario semanal de los espacios seleccionados. Las excepciones y bloqueos no se copian.
                </p>
                <p className="mt-1">
                  {isCancha
                    ? 'Se copian los días, las franjas y sus precios.'
                    : 'Solo se copia la disponibilidad. Los precios de cada espacio se mantienen.'}
                </p>
              </div>
            </>
          )}
        </div>

        <div
          className="sticky bottom-0 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 sm:px-6 backdrop-blur"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={selected.length === 0 || copying}
            onClick={() => onCopy(selected)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Copy size={16} /> {copying ? 'Copiando...' : `Copiar a ${selected.length || 0} espacio(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyScheduleDialog;
