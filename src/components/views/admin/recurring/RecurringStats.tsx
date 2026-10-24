"use client";

import React from 'react';
import { CalendarRange, Repeat, TrendingUp } from 'lucide-react';
import { formatCLP, RecurringStats } from './recurringUtils';

interface RecurringStatsProps {
  stats: RecurringStats;
}

const CARD_CLASS = 'rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';

export const RecurringStatsCards: React.FC<RecurringStatsProps> = ({ stats }) => {
  const cards = [
    {
      key: 'active',
      label: 'Activas',
      hint: 'Recurrencias vigentes',
      value: String(stats.active),
      icon: Repeat,
      iconClass: 'bg-slate-900 text-white',
    },
    {
      key: 'weekly',
      label: 'Indefinidas',
      hint: 'Sin fecha de término',
      value: String(stats.weekly),
      icon: Repeat,
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      key: 'series',
      label: 'Series',
      hint: 'Con semanas definidas',
      value: String(stats.series),
      icon: CalendarRange,
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'income',
      label: 'Ingreso semanal',
      hint: 'Suma de tarifas activas',
      value: formatCLP(stats.weeklyIncome),
      icon: TrendingUp,
      iconClass: 'bg-sky-100 text-sky-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" data-testid="recurring-stats">
      {cards.map((card) => (
        <div key={card.key} className={CARD_CLASS}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs">
              {card.label}
            </p>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
              <card.icon size={15} />
            </span>
          </div>
          <p className="mt-2 truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {card.value}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 sm:text-xs">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
};
