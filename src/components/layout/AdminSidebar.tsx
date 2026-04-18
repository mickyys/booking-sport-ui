"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Trophy, 
  Clock, 
  CalendarRange, 
  CalendarDays,
  Settings,
  Menu,
  X,
  Users,
  QrCode,
  Repeat
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: CalendarDays, label: 'Agenda Semanal', end: true },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/calendar', icon: CalendarRange, label: 'Bloqueos y Reservas' },
  { to: '/admin/recurring', icon: Repeat, label: 'Reservas' },
  { to: '/admin/courts', icon: Trophy, label: 'Canchas' },
  { to: '/admin/schedules', icon: Clock, label: 'Horarios y Tarifas' },
  { to: '/admin/qr', icon: QrCode, label: 'QR' },
  { to: '/admin/settings', icon: Settings, label: 'Configuración' },
];

interface AdminSidebarProps {
  sportCenterName?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ sportCenterName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-60">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95 border border-slate-700"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu Overlay */}
      <div 
        className={`fixed inset-y-0 left-0 z-[60] lg:z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Admin Panel
            </h2>
            <p className="text-sm text-slate-500">Gestión de Centro Deportivo</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = item.end
                ? pathname === item.to
                : pathname?.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                    ${isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-x-1'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Centro</p>
              <p className="text-sm font-bold text-slate-700 truncate">{sportCenterName || 'Cargando...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
