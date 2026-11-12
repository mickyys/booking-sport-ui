"use client";

import React from 'react';
import { CHARGE_MODE_LABELS, SlotChargeMode, formatCLP, timeFromMinutes } from '@/utils/schedule';

const TIME_OPTIONS = Array.from({ length: 49 }, (_, index) => timeFromMinutes(index * 30));

const CHARGE_OPTIONS: SlotChargeMode[] = ['none', 'full', 'partial'];

const CHARGE_ACTIVE_CLASS: Record<SlotChargeMode, string> = {
  none: 'bg-slate-900 text-white shadow-sm',
  full: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20',
  partial: 'bg-blue-600 text-white shadow-sm shadow-blue-600/20',
};

export const TimeSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}> = ({ value, onChange, className = '', ariaLabel }) => {
  const options = TIME_OPTIONS.includes(value) ? TIME_OPTIONS : [value, ...TIME_OPTIONS];
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${className}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export const PriceField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}> = ({ value, onChange, disabled, className = '' }) => (
  <div className={className}>
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-sm">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value > 0 ? String(value) : ''}
        placeholder="0"
        disabled={disabled}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          onChange(digits ? Number.parseInt(digits, 10) : 0);
        }}
        className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
    <span className="block text-[10px] font-semibold text-slate-400 mt-1">{formatCLP(value)}</span>
  </div>
);

export const ChargeModeField: React.FC<{
  value: SlotChargeMode | null;
  onChange: (value: SlotChargeMode) => void;
  allowed?: SlotChargeMode[];
  partialPercent?: number;
  hint?: string;
  className?: string;
}> = ({
  value,
  onChange,
  allowed = CHARGE_OPTIONS,
  partialPercent = 50,
  hint,
  className = '',
}) => {
  const percent = Math.max(1, Math.min(99, Math.round(partialPercent || 50)));
  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label="Cobro de la franja"
        className="inline-flex w-full max-w-xs rounded-lg border border-slate-200 bg-white p-0.5"
      >
        {CHARGE_OPTIONS.map((option) => {
          const active = value === option;
          const enabled = allowed.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!enabled}
              onClick={() => onChange(option)}
              title={enabled ? undefined : 'No disponible con la modalidad actual del centro'}
              className={`min-h-8 flex-1 rounded-md px-2 text-[11px] font-black transition-colors ${
                active ? CHARGE_ACTIVE_CLASS[option] : 'text-slate-500 hover:bg-slate-50'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {CHARGE_MODE_LABELS[option]}
            </button>
          );
        })}
      </div>
      {value === null && (
        <p className="mt-1 text-[11px] font-semibold text-amber-600">
          Pago opcional heredado: elige una opción para normalizarlo.
        </p>
      )}
      {value === 'partial' && (
        <p className="mt-1 text-[11px] font-semibold text-blue-600">
          El cliente paga el {percent}% al reservar y el resto en el club.
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
};
