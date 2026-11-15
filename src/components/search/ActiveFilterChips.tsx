"use client";
import React from 'react';
import { X } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

const ActiveFilterChips: React.FC<{ chips: FilterChip[] }> = ({ chips }) => {
  if (chips.length === 0) return null;
  return (
    <div className="md:hidden mt-2 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={`Quitar filtro ${chip.label}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium"
        >
          {chip.label}
          <X className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
};

export default ActiveFilterChips;
