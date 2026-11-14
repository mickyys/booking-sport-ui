"use client";

import React from 'react';
import { CalendarDays, Clock3, Copy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SpaceCategory } from '@/types';
import {
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  ScheduleGroup,
  SlotChargeMode,
  addMinutes,
  applyChargeMode,
  chargeModeForSlot,
  chargeSummaryForSlots,
  chargeSummaryLabel,
  formatCLP,
  formatDays,
  formatPriceRange,
  groupSummary,
  minutesFromTime,
  slotForCategory,
} from '@/utils/schedule';
import { ChargeModeField, PriceField, TimeSelect } from './ScheduleInputs';

export const ScheduleDaysSelector: React.FC<{
  selected: number[];
  disabledDays: Set<number>;
  onChange: (days: number[]) => void;
}> = ({ selected, disabledDays, onChange }) => {
  const toggleDay = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((value) => value !== day));
      return;
    }
    if (disabledDays.has(day)) return;
    onChange([...selected, day]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_ORDER.map((day) => {
        const active = selected.includes(day);
        const disabled = disabledDays.has(day) && !active;
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            onClick={() => toggleDay(day)}
            title={disabled ? `${DAY_LABELS[day]} ya está en otro horario` : DAY_LABELS[day]}
            className={`min-h-10 rounded-lg border px-2.5 text-[11px] font-black transition-colors ${
              active
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                : disabled
                  ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
            }`}
          >
            <span className="sm:hidden">{DAY_SHORT[day]}</span>
            <span className="hidden sm:inline">{DAY_LABELS[day].slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
};

export const ScheduleSlotRow: React.FC<{
  slot: import('@/types').ScheduleRuleSlot;
  category: SpaceCategory;
  canRemove: boolean;
  onChange: (slot: import('@/types').ScheduleRuleSlot) => void;
  onRemove: () => void;
  allowedModes?: SlotChargeMode[];
  partialPercent?: number;
  inheritedPartial?: boolean;
  paymentHint?: string;
}> = ({ slot, category, canRemove, onChange, onRemove, allowedModes, partialPercent, inheritedPartial, paymentHint }) => {
  const showPrice = category === 'cancha';
  const chargeMode = chargeModeForSlot(slot, inheritedPartial);
  const priceWarning = showPrice && chargeMode !== 'none' && slot.price <= 0
    ? 'El cobro será $0: define un precio por hora.'
    : undefined;
  const hint = [priceWarning, paymentHint].filter(Boolean).join(' ') || undefined;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className={`grid grid-cols-2 gap-2 items-start ${showPrice ? 'sm:grid-cols-[1fr_1fr_1.1fr_auto]' : 'sm:grid-cols-[1fr_1fr_auto]'}`}>
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Inicio</label>
          <TimeSelect
            value={slot.start_time}
            onChange={(value) => onChange({ ...slot, start_time: value })}
            ariaLabel="Hora de inicio"
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Fin</label>
          <TimeSelect
            value={slot.end_time}
            onChange={(value) => onChange({ ...slot, end_time: value })}
            ariaLabel="Hora de fin"
            className="w-full"
          />
        </div>
        {showPrice && (
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Precio/hora</label>
            <PriceField
              value={slot.price}
              onChange={(value) => onChange({ ...slot, price: value })}
            />
          </div>
        )}
        <div className="col-span-2 flex justify-end sm:col-span-1">
          <button
            type="button"
            disabled={!canRemove}
            onClick={onRemove}
            title={canRemove ? 'Eliminar franja' : 'Debe quedar al menos una franja'}
            className="mt-1 inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 sm:mt-5 sm:h-8 sm:w-8 sm:justify-center sm:px-0"
          >
            <Trash2 size={15} />
            <span className="sm:hidden">Eliminar franja</span>
          </button>
        </div>
      </div>
      {showPrice && (
        <div className="mt-2.5 border-t border-slate-200/70 pt-2.5">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Cobro</label>
          <ChargeModeField
            value={chargeMode}
            onChange={(mode) => onChange(applyChargeMode(slot, mode))}
            allowed={allowedModes}
            partialPercent={partialPercent}
            hint={hint}
          />
        </div>
      )}
    </div>
  );
};

interface ScheduleGroupCardProps {
  group: ScheduleGroup;
  category: SpaceCategory;
  otherGroups: ScheduleGroup[];
  onChange: (group: ScheduleGroup) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  allowedModes?: SlotChargeMode[];
  partialPercent?: number;
  inheritedPartial?: boolean;
  paymentHint?: string;
}

const CHARGE_BADGE_CLASS: Record<string, string> = {
  none: 'border-slate-200 bg-slate-50 text-slate-500',
  full: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  partial: 'border-blue-200 bg-blue-50 text-blue-700',
  optional: 'border-amber-200 bg-amber-50 text-amber-700',
  mixed: 'border-amber-200 bg-amber-50 text-amber-700',
};

export const ScheduleGroupCard: React.FC<ScheduleGroupCardProps> = ({
  group,
  category,
  otherGroups,
  onChange,
  onDelete,
  onDuplicate,
  allowedModes,
  partialPercent,
  inheritedPartial,
  paymentHint,
}) => {
  const disabledDays = new Set(otherGroups.flatMap((other) => other.days));
  const isCancha = category === 'cancha';
  const isFullDay = category === 'sede' || category === 'piscina';
  const chargeSummary = chargeSummaryForSlots(group.slots, inheritedPartial);

  const updateSlot = (index: number, slot: import('@/types').ScheduleRuleSlot) => {
    onChange({
      ...group,
      slots: group.slots.map((value, slotIndex) => (slotIndex === index ? slot : value)),
    });
  };

  const removeSlot = (index: number) => {
    onChange({ ...group, slots: group.slots.filter((_, slotIndex) => slotIndex !== index) });
  };

  const addSlot = () => {
    const last = group.slots[group.slots.length - 1];
    const start = last?.end_time || '09:00';
    const startMinutes = minutesFromTime(start);
    if (startMinutes === null || startMinutes >= 1440) {
      toast.info('La última franja termina a las 24:00. Ajusta el fin para agregar otra.');
      return;
    }
    const end = addMinutes(start, 60);
    onChange({
      ...group,
      slots: [
        ...group.slots,
        slotForCategory(category, start, end, last?.price || 0, last ? chargeModeForSlot(last, inheritedPartial) ?? 'none' : 'none'),
      ],
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-black text-slate-700 border border-slate-200">
              <CalendarDays size={12} /> {formatDays(group.days)}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">{groupSummary(group, category)}</span>
            {isCancha && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${CHARGE_BADGE_CLASS[chargeSummary]}`}>
                {chargeSummaryLabel(chargeSummary)}
              </span>
            )}
          </div>
          <ScheduleDaysSelector
            selected={group.days}
            disabledDays={disabledDays}
            onChange={(days) => onChange({ ...group, days })}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            title="Copiar estas franjas a los días libres"
          >
            <Copy size={13} /> Duplicar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"
            title="Eliminar horario"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {isFullDay ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">
            <Clock3 size={16} className="text-slate-400" />
            00:00 – 24:00 · Día completo
          </div>
        ) : (
          <>
            {group.slots.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-400">
                Sin franjas configuradas.
              </p>
            )}
            {group.slots.map((slot, index) => (
              <ScheduleSlotRow
                key={index}
                slot={slot}
                category={category}
                canRemove={group.slots.length > 1}
                onChange={(value) => updateSlot(index, value)}
                onRemove={() => removeSlot(index)}
                allowedModes={allowedModes}
                partialPercent={partialPercent}
                inheritedPartial={inheritedPartial}
                paymentHint={paymentHint}
              />
            ))}
            {(isCancha || group.slots.length === 0) && (
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-xs font-black text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} /> Agregar franja
              </button>
            )}
            {category === 'quincho' && group.slots.length > 0 && (
              <p className="text-[11px] text-slate-400">
                El precio del quincho se define en el espacio, no por franja.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const WeeklyPreview: React.FC<{
  groups: ScheduleGroup[];
  category: SpaceCategory;
}> = ({ groups, category }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">Vista previa semanal</p>
        <p className="text-xs text-slate-400">Así quedará la disponibilidad para tus clientes.</p>
      </div>
      <div className="divide-y divide-slate-100 sm:hidden">
        {DAY_ORDER.map((day) => {
          const group = groups.find((value) => value.days.includes(day));
          const slot = group?.slots?.[0];
          const prices = group && group.slots.length > 0
            ? group.slots.map((value) => value.price)
            : [];
          const detail = !group
            ? 'Cerrado'
            : category === 'sede' || category === 'piscina'
              ? 'Día completo'
              : category === 'quincho'
                ? slot ? `${slot.start_time}–${slot.end_time}` : 'Sin rango'
                : prices.length === 1 && slot
                  ? `${slot.start_time}–${slot.end_time} · ${formatCLP(slot.price)}`
                  : prices.length > 1
                    ? `${group.slots.length} franjas · ${formatPriceRange(Math.min(...prices), Math.max(...prices))}`
                    : 'Abierto';
          return (
            <div key={day} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className={`text-[11px] font-black uppercase ${group ? 'text-emerald-700' : 'text-slate-400'}`}>
                {DAY_SHORT[day]}
              </span>
              <span className={`min-w-0 truncate text-xs font-semibold ${group ? 'text-slate-600' : 'text-slate-400'}`}>
                {detail}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hidden grid-cols-7 gap-1.5 p-3 sm:grid">
        {DAY_ORDER.map((day) => {
          const group = groups.find((value) => value.days.includes(day));
          const slot = group?.slots?.[0];
          const price = group && group.slots.length > 0
            ? Math.min(...group.slots.map((value) => value.price))
            : 0;
          return (
            <div
              key={day}
              className={`rounded-xl border px-1.5 py-2 text-center ${
                group ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <p className={`text-[10px] font-black uppercase ${group ? 'text-emerald-700' : 'text-slate-400'}`}>
                {DAY_SHORT[day]}
              </p>
              {group ? (
                <>
                  <p className="mt-1 text-[10px] font-bold text-slate-700 leading-tight">
                    {category === 'sede' || category === 'piscina'
                      ? 'Día completo'
                      : slot
                        ? slot.start_time
                        : 'Abierto'}
                  </p>
                  {category === 'cancha' && group.slots.length > 0 && (
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400 leading-tight">
                      {formatPriceRange(
                        Math.min(...group.slots.map((value) => value.price)),
                        Math.max(...group.slots.map((value) => value.price)),
                      )}
                    </p>
                  )}
                  {category === 'quincho' && slot && (
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400 leading-tight">
                      {slot.start_time}–{slot.end_time}
                    </p>
                  )}
                  {category === 'cancha' && group.slots.length === 0 && (
                    <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{formatCLP(price)}</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[10px] font-bold text-slate-400">Cerrado</p>
              )}
            </div>
          );
        })}
      </div>
      {groups.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-1">
          {groups.map((group) => (
            <p key={group.id} className="text-[11px] font-semibold text-slate-500">
              {groupSummary(group, category)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
