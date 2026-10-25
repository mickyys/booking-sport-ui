"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CalendarCheck, History, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { PanelSidebar, type PanelNavItem } from '@/components/layout/PanelSidebar';

const navItems: PanelNavItem[] = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Resumen', end: true },
  { to: '/superadmin/centers', icon: Building2, label: 'Centros deportivos' },
  { to: '/superadmin/bookings', icon: CalendarCheck, label: 'Reservas' },
  { to: '/superadmin/audit', icon: History, label: 'Auditoría' },
];

export const SuperAdminSidebar: React.FC = () => {
  return (
    <PanelSidebar
      id="superadmin-sidebar"
      ariaLabel="Navegación superadmin"
      title="Superadmin"
      subtitle="Plataforma ReservaloYA"
      navItems={navItems}
      mobile={{
        title: 'Superadmin',
        subtitle: 'Plataforma ReservaloYA',
        actionHref: '/superadmin',
        actionIcon: ShieldCheck,
        actionLabel: 'Ir al resumen',
        openLabel: 'Abrir menú de superadmin',
      }}
      footer={
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Plataforma</p>
            <p className="truncate text-sm font-bold text-slate-700">ReservaloYA</p>
          </div>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={18} aria-hidden="true" /> Volver al sitio
          </Link>
        </div>
      }
    />
  );
};
