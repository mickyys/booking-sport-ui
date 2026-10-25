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
  Waves,
  Plug,
} from 'lucide-react';
import { PanelSidebar, type PanelNavItem } from '@/components/layout/PanelSidebar';

const navItems: PanelNavItem[] = [
  { to: '/admin', icon: CalendarDays, label: 'Agenda', end: true },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/admin/recurring', icon: Repeat, label: 'Reservas fijas' },
  { to: '/admin/facility-bookings', icon: Waves, label: 'Sedes y piscinas' },
  { to: '/admin/spaces', icon: Trophy, label: 'Espacios' },
  { to: '/admin/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/qr', icon: QrCode, label: 'QR' },
  { to: '/admin/settings', icon: Settings, label: 'Configuración' },
  { to: '/admin/onboarding', icon: Plug, label: 'Onboarding' },
];

interface AdminSidebarProps {
  sportCenterName?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ sportCenterName }) => {
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
        actionHref: '/admin',
        actionIcon: CalendarDays,
        actionLabel: 'Ir a la agenda',
        openLabel: 'Abrir menú de administración',
      }}
      footer={
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Centro</p>
          <p className="text-sm font-bold text-slate-700 truncate">{sportCenterName || 'Cargando...'}</p>
        </div>
      }
    />
  );
};
