"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  CalendarDays,
  Settings,
  Menu,
  X,
  Users,
  QrCode,
  Repeat,
  Plug,
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: CalendarDays, label: 'Agenda', end: true },
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/admin/recurring', icon: Repeat, label: 'Reservas fijas' },
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
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al navegar
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloquea el scroll del fondo y permite cerrar con Escape en mobile
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Barra superior mobile */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
          aria-label="Abrir menú de administración"
          aria-expanded={isOpen}
          aria-controls="admin-sidebar"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-black text-slate-900">{sportCenterName || 'Admin Panel'}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">Gestión del centro</p>
        </div>
        <Link
          href="/admin"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
          aria-label="Ir a la agenda"
        >
          <CalendarDays size={20} />
        </Link>
      </header>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-[70] w-72 max-w-[85vw] transform bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:static lg:z-40 lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Menú de administración"
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Admin Panel
              </h2>
              <p className="text-sm text-slate-500">Gestión de Centro Deportivo</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
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
                    flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                    ${isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
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
      </aside>
    </>
  );
};
