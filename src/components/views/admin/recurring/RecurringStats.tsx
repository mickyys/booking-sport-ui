"use client";

import React from 'react';
import { formatCLP, RecurringStats } from './recurringUtils';

interface RecurringStatsProps {
  stats: RecurringStats;
}

export const RecurringStatsCards: React.FC<RecurringStatsProps> = ({ stats }) => {
  const items = [
    { key: 'active', label: 'Activas', value: String(stats.active), valueClass: 'text-slate-900' },
    {
      key: 'income',
      label: 'Ingreso semanal',
      value: formatCLP(stats.weeklyIncome),
      valueClass: 'text-emerald-600',
    },
    { key: 'finished', label: 'Finalizadas', value: String(stats.finished), valueClass: 'text-slate-500' },
  ];

  return (
    <dl
      className="grid grid-cols-3 divide-x divide-slate-100 rounded-2xl border border-slate-200 bg-white"
      data-testid="recurring-stats"
    >
      {items.map((item) => (
        <div key={item.key} className="min-w-0 px-3 py-3 sm:px-5 sm:py-4">
          <dt className="truncate text-xs font-semibold text-slate-500">{item.label}</dt>
          <dd className={`mt-0.5 truncate text-lg font-black tracking-tight sm:text-2xl ${item.valueClass}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
