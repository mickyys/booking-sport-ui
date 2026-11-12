"use client";

import React from 'react';
import { formatCLP } from './dashboardUtils';

interface DashboardStatsProps {
  data: {
    todayBookingsCount?: number;
    todayRevenue?: number;
    todayOnlineRevenue?: number;
    todayVenueRevenue?: number;
    totalRevenue?: number;
    totalOnlineRevenue?: number;
    totalVenueRevenue?: number;
    cancelledCount?: number;
  };
}

const Split: React.FC<{ online?: number; venue?: number }> = ({ online, venue }) => (
  <p className="mt-1 truncate text-xs font-medium text-slate-500">
    Online <span className="font-bold text-blue-600">{formatCLP(online)}</span>
    <span aria-hidden="true"> · </span>
    Presencial <span className="font-bold text-emerald-600">{formatCLP(venue)}</span>
  </p>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => (
  <dl
    data-testid="dashboard-stats"
    className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 lg:grid-cols-4"
  >
    <div className="min-w-0 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <dt className="truncate text-xs font-semibold text-slate-500">Reservas hoy</dt>
      <dd className="mt-0.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
        {data.todayBookingsCount ?? 0}
      </dd>
    </div>
    <div className="min-w-0 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <dt className="truncate text-xs font-semibold text-slate-500">Ingresos hoy</dt>
      <dd className="mt-0.5 truncate text-xl font-black tracking-tight text-emerald-600 sm:text-2xl">
        {formatCLP(data.todayRevenue)}
      </dd>
      <Split online={data.todayOnlineRevenue} venue={data.todayVenueRevenue} />
    </div>
    <div className="min-w-0 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <dt className="truncate text-xs font-semibold text-slate-500">Ingresos totales</dt>
      <dd className="mt-0.5 truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
        {formatCLP(data.totalRevenue)}
      </dd>
      <Split online={data.totalOnlineRevenue} venue={data.totalVenueRevenue} />
    </div>
    <div className="min-w-0 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <dt className="truncate text-xs font-semibold text-slate-500">Cancelaciones</dt>
      <dd className="mt-0.5 text-xl font-black tracking-tight text-red-600 sm:text-2xl">
        {data.cancelledCount ?? 0}
      </dd>
    </div>
  </dl>
);
