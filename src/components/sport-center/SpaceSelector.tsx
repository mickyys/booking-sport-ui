"use client";

import React from 'react';
import { Trophy, Trees, Building, Waves, Check } from 'lucide-react';
import { SpaceCategory } from '@/types';
import { BrandingPalette } from '@/utils/branding';

export interface SpaceOption {
  id: string;
  category: SpaceCategory;
  name: string;
  image?: string;
  subLabel?: string;
}

const CATEGORY_META: Record<SpaceCategory, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  cancha: { label: 'Canchas', Icon: Trophy },
  quincho: { label: 'Quinchos', Icon: Trees },
  sede: { label: 'Sedes', Icon: Building },
  piscina: { label: 'Piscinas', Icon: Waves },
};

const CATEGORY_ORDER: SpaceCategory[] = ['cancha', 'quincho', 'sede', 'piscina'];

interface SpaceSelectorProps {
  spaces: SpaceOption[];
  selectedId: string | null;
  onSelect: (space: SpaceOption) => void;
  branding: BrandingPalette;
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({ spaces, selectedId, onSelect, branding }) => {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: spaces.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map(({ category, items }) => {
        const { label, Icon } = CATEGORY_META[category];
        return (
          <div key={category}>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </p>
            <div role="radiogroup" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
              {items.map((space) => {
                const selected = space.id === selectedId;
                return (
                  <button
                    key={space.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelect(space)}
                    className="relative flex min-h-14 shrink-0 items-center gap-3 rounded-2xl border-2 bg-white py-2 pl-2 pr-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      borderColor: selected ? branding.primary : '#e2e8f0',
                      backgroundColor: selected ? `${branding.primary}0f` : 'white',
                    }}
                  >
                    {space.image ? (
                      <img
                        src={space.image}
                        alt=""
                        loading="lazy"
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${branding.primary}1a`, color: branding.primary }}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{space.name}</span>
                      {space.subLabel && <span className="block truncate text-xs text-slate-600">{space.subLabel}</span>}
                    </span>
                    {selected && (
                      <span
                        className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: branding.primary }}
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
