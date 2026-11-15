"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { AdminPanelProvider, useAdminPanel } from '@/context/AdminPanelContext';
import { ViewAsCenterProvider } from '@/context/ViewAsCenterContext';
import { useBookingStore } from '@/store/useBookingStore';
import { installViewAsFetch, setViewCenterId } from '@/lib/viewAs';

const tabs = [
  { sub: '', label: 'Agenda' },
  { sub: '/dashboard', label: 'Inicio' },
  { sub: '/recurring', label: 'Reservas fijas' },
  { sub: '/spaces', label: 'Espacios' },
  { sub: '/socios', label: 'Socios' },
  { sub: '/users', label: 'Usuarios' },
  { sub: '/qr', label: 'QR' },
  { sub: '/settings', label: 'Configuración' },
];

const resetAdminData = () =>
  useBookingStore.setState({ adminCourts: [], adminSpaces: [], adminDashboardData: null });

const ViewHeader: React.FC<{ basePath: string }> = ({ basePath }) => {
  const { currentSportCenter } = useAdminPanel();
  const pathname = usePathname() || '';
  const rest = pathname.slice(basePath.length);
  const active = (sub: string) => (sub === '' ? rest === '' || rest === '/' : rest.startsWith(sub));
  const centerId = basePath.split('/')[3];

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <Eye size={16} aria-hidden="true" />
          Viendo {currentSportCenter?.name || 'centro'} como superadmin (solo lectura)
        </p>
        <Link
          href={`/superadmin/centers/${centerId}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Volver al centro
        </Link>
      </div>
      <nav aria-label="Secciones del centro" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.sub}
            href={`${basePath}${t.sub}`}
            aria-current={active(t.sub) ? 'page' : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${
              active(t.sub)
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

const ViewScope: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const basePath = `/superadmin/centers/${id}/view`;
  // Debe quedar fijado antes de que los hijos hagan sus primeras llamadas.
  const initialized = React.useRef<string | null>(null);
  if (initialized.current !== id) {
    installViewAsFetch();
    resetAdminData();
    setViewCenterId(id);
    initialized.current = id;
  }

  React.useEffect(() => {
    setViewCenterId(id);
    return () => {
      setViewCenterId(null);
      resetAdminData();
    };
  }, [id]);

  const value = React.useMemo(() => ({ centerId: id, basePath }), [id, basePath]);

  return (
    <ViewAsCenterProvider value={value}>
      <AdminPanelProvider>
        <ViewHeader basePath={basePath} />
        {children}
      </AdminPanelProvider>
    </ViewAsCenterProvider>
  );
};

export default function CenterViewLayout({ children }: { children: React.ReactNode }) {
  const id = (usePathname() || '').split('/')[3] || '';
  return <ViewScope key={id} id={id}>{children}</ViewScope>;
}
