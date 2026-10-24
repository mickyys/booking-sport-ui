"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { Space } from '@/types';
import {
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  ScheduleGroup,
  SlotChargeMode,
  allowedChargeModes,
  createGroupId,
  defaultRangeForSpace,
  formatCLP,
  formatDays,
  minutesFromTime,
  slotForCategory,
} from '@/utils/schedule';
import { ChargeModeField, PriceField, TimeSelect } from './ScheduleInputs';

interface CreateScheduleDialogProps {
  open: boolean;
  space: Space;
  groups: ScheduleGroup[];
  onClose: () => void;
  onCreate: (group: ScheduleGroup) => void;
  paymentMode?: string | null;
  partialPercent?: number;
}

const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Lun–Vie', days: [1, 2, 3, 4, 5] },
  { label: 'Sáb–Dom', days: [6, 0] },
  { label: 'Todos', days: [1, 2, 3, 4, 5, 6, 0] },
];

export const CreateScheduleDialog: React.FC<CreateScheduleDialogProps> = ({
  open,
  space,
  groups,
  onClose,
  onCreate,
  paymentMode,
  partialPercent = 50,
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('23:00');
  const [price, setPrice] = useState(0);
  const [chargeMode, setChargeMode] = useState<SlotChargeMode>('none');
  const [error, setError] = useState<string | null>(null);

  const usedDays = useMemo(() => new Set(groups.flatMap((group) => group.days)), [groups]);
  const availableDays = useMemo(() => DAY_ORDER.filter((day) => !usedDays.has(day)), [usedDays]);
  const isFullDay = space.category === 'sede' || space.category === 'piscina';
  const isCancha = space.category === 'cancha';
  const allowedModes = allowedChargeModes(paymentMode);
  const paymentHint = paymentMode === 'pay_at_center'
    ? 'Modalidad Solo reservas: el cobro online está desactivado.'
    : paymentMode === 'pay_online'
      ? 'Modalidad pago online: toda franja exige pago; elige completo o abono.'
      : undefined;

  useEffect(() => {
    if (!open) return;
    const range = defaultRangeForSpace(space);
    setSelectedDays(availableDays);
    setStart(range.start);
    setEnd(range.end);
    setPrice(0);
    setChargeMode(paymentMode === 'pay_online' ? 'full' : 'none');
    setError(null);
  }, [open, space.id, paymentMode]);

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

  const toggleDay = (day: number) => {
    if (usedDays.has(day)) return;
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day],
    );
  };

  const applyPreset = (days: number[]) => {
    setSelectedDays(days.filter((day) => availableDays.includes(day)));
  };

  const handleCreate = () => {
    if (selectedDays.length === 0) {
      setError('Selecciona al menos un día.');
      return;
    }
    if (!isFullDay) {
      const startMinutes = minutesFromTime(start);
      const endMinutes = minutesFromTime(end);
      if (startMinutes === null || endMinutes === null) {
        setError('Ingresa un horario válido.');
        return;
      }
      if (endMinutes <= startMinutes) {
        setError('La hora de fin debe ser mayor que la de inicio.');
        return;
      }
    }

    onCreate({
      id: createGroupId(),
      days: [...selectedDays],
      slots: [slotForCategory(space.category, start, end, price, chargeMode)],
    });
  };

  const sortedDays = DAY_ORDER.filter((day) => selectedDays.includes(day));
  const chargeLabel = chargeMode === 'partial' ? 'Abono' : chargeMode === 'full' ? 'Cobro completo' : 'Sin cobro';
  const preview = isFullDay
    ? `${formatDays(sortedDays)} · Día completo`
    : `${formatDays(sortedDays)} · ${start}–${end}${isCancha ? ` · ${formatCLP(price)}/hora · ${chargeLabel}` : ''}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[100dvh] sm:max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 backdrop-blur px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Nuevo horario</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{space.name}</h3>
            <p className="text-sm text-slate-500">Crea una regla semanal en un solo paso.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 space-y-6">
          {availableDays.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Todos los días ya tienen un horario. Edita un horario existente para cambiar sus días.
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">Días</label>
                  <span className="text-xs font-bold text-slate-400">{selectedDays.length} seleccionado(s)</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESETS.map((preset) => {
                    const days = preset.days.filter((day) => availableDays.includes(day));
                    const active = days.length > 0 && days.length === selectedDays.length && days.every((day) => selectedDays.includes(day));
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={days.length === 0}
                        onClick={() => applyPreset(preset.days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-40'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedDays([])}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:border-slate-300"
                  >
                    Ninguno
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAY_ORDER.map((day) => {
                    const active = selectedDays.includes(day);
                    const disabled = usedDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleDay(day)}
                        title={disabled ? `${DAY_LABELS[day]} ya tiene horario` : DAY_LABELS[day]}
                        className={`rounded-xl border px-1 py-2.5 text-xs font-black transition-all ${
                          active
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                            : disabled
                              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                        }`}
                      >
                        <span className="sm:hidden">{DAY_SHORT[day]}</span>
                        <span className="hidden sm:inline">{DAY_LABELS[day].slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  {isFullDay ? 'Horario' : space.category === 'quincho' ? 'Disponibilidad' : 'Rango horario'}
                </label>
                {isFullDay ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    00:00 – 24:00 · Día completo
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <TimeSelect value={start} onChange={setStart} ariaLabel="Hora de inicio" />
                    <span className="text-slate-400 text-sm font-bold">→</span>
                    <TimeSelect value={end} onChange={setEnd} ariaLabel="Hora de fin" />
                  </div>
                )}
              </div>

              {isCancha && (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                    Precio por hora
                  </label>
                  <PriceField value={price} onChange={setPrice} className="max-w-[220px]" />
                  <p className="text-xs text-slate-400 mt-1">Puedes agregar más franjas con otro precio después.</p>
                </div>
              )}

              {isCancha && (
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                    Cobro
                  </label>
                  <ChargeModeField
                    value={chargeMode}
                    onChange={setChargeMode}
                    allowed={allowedModes}
                    partialPercent={partialPercent}
                    hint={
                      chargeMode !== 'none' && price <= 0
                        ? [paymentHint, 'El cobro será $0: define un precio por hora.'].filter(Boolean).join(' ')
                        : paymentHint
                    }
                  />
                </div>
              )}

              {space.category === 'quincho' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  El precio del quincho se configura en el espacio (día completo y media jornada).
                </div>
              )}

              {space.category === 'sede' || space.category === 'piscina' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  El precio se configura en el espacio (por día y por mes).
                </div>
              ) : null}

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Vista previa</p>
                <p className="text-sm font-bold text-emerald-900 mt-0.5">{preview}</p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={availableDays.length === 0}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <CalendarPlus size={16} /> Crear horario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateScheduleDialog;
