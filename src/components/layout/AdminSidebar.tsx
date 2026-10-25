"use client";
import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  CalendarDays,
  Settings,
  Users,
  QrCode,
  Repeat,
  Plug,
  BadgePercent,
  Star,
} from 'lucide-react';
import { PanelSidebar, type PanelNavItem } from '@/components/layout/PanelSidebar';

const navItems: PanelNavItem[] = [
  { to: '/admin', icon: CalendarDays, label: 'Agenda', end: true },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/admin/recurring', icon: Repeat, label: 'Reservas fijas' },
  { to: '/admin/spaces', icon: Trophy, label: 'Espacios' },
  { to: '/admin/socios', icon: BadgePercent, label: 'Socios' },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/qr', icon: QrCode, label: 'QR' },
  { to: '/admin/settings', icon: Settings, label: 'Configuración' },
  { to: '/admin/onboarding', icon: Plug, label: 'Onboarding' },
];

interface AdminSidebarProps {
  sportCenterName?: string;
  isFeatured?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ sportCenterName, isFeatured = false }) => {
  return (
    <PanelSidebar
      id="admin-sidebar"
      ariaLabel="Menú de administración"
      title="Admin Panel"
      subtitle="Gestión de Centro Deportivo"
      navItems={navItems}
      mobile={{
        title: sportCenterName || 'Admin Panel',
        subtitle: 'Gestión del centro',
        badge: isFeatured ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
            <Star size={9} className="fill-amber-500 text-amber-500" />
            Destacado
          </span>
        ) : undefined,
        actionHref: '/admin',
        actionIcon: CalendarDays,
        actionLabel: 'Ir a la agenda',
        openLabel: 'Abrir menú de administración',
      }}
      footer={
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Centro</p>
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-sm font-bold text-slate-700">{sportCenterName || 'Cargando...'}</p>
            {isFeatured && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
                <Star size={9} className="fill-amber-500 text-amber-500" />
                Destacado
              </span>
            )}
          </div>
        </div>
      }
    />
  );
};
