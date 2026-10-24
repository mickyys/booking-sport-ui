"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import {
  ArrowLeft,
  Building2,
  Clock,
  DollarSign,
  Edit,
  Info,
  Loader2,
  MapPin,
  Trees,
  Trophy,
  Users,
  Waves,
} from 'lucide-react';
import { toast } from 'sonner';
import { Space, SpaceCategory } from '@/types';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { useBookingStore } from '@/store/useBookingStore';
import { AdminSpaceSchedule } from '@/components/views/admin/AdminSpaceSchedule';
import SpaceFormModal from '@/components/booking/SpaceFormModal';
import { facilityPriceSummary } from '@/utils/schedule';

const CATEGORY_META: Record<SpaceCategory, { label: string; icon: React.ReactNode; badge: string; accent: string }> = {
  cancha: {
    label: 'Cancha',
    icon: <Trophy size={22} />,
    badge: 'bg-emerald-100 text-emerald-700',
    accent: 'bg-emerald-500',
  },
  quincho: {
    label: 'Quincho',
    icon: <Trees size={22} />,
    badge: 'bg-amber-100 text-amber-700',
    accent: 'bg-amber-500',
  },
  sede: {
    label: 'Sede',
    icon: <Building2 size={22} />,
    badge: 'bg-indigo-100 text-indigo-700',
    accent: 'bg-indigo-500',
  },
  piscina: {
    label: 'Piscina',
    icon: <Waves size={22} />,
    badge: 'bg-sky-100 text-sky-700',
    accent: 'bg-sky-500',
  },
};

type Tab = 'info' | 'horarios';

export default function SpaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { spaces: rawSpaces, currentSportCenter } = useAdminPanel();
  const fetchAdminSpaces = useBookingStore((state) => state.fetchAdminSpaces);
  const updateAdminSpace = useBookingStore((state) => state.updateAdminSpace);

  const [tab, setTab] = useState<Tab>('horarios');
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const spaces = useMemo(
    () => ((rawSpaces || []) as Space[]).map((space: any) => ({
      ...space,
      id: space.id || space._id,
      category: (space.category || 'cancha') as SpaceCategory,
    })),
    [rawSpaces],
  );

  const space = spaces.find((item) => item.id === params.id);

  useEffect(() => {
    if (spaces.length > 0) {
      setLoaded(true);
      return;
    }
    // El provider carga los espacios al montar el panel; si algo falla,
    // dejamos de mostrar el skeleton para no bloquear la vista.
    const timeout = setTimeout(() => setLoaded(true), 5000);
    return () => clearTimeout(timeout);
  }, [spaces.length]);

  const handleSave = async (data: Space) => {
    if (!space) return;
    const { id, sport_center_id, ...payload } = data;
    await updateAdminSpace(space.id, payload, getAccessTokenSilently);
    await fetchAdminSpaces(getAccessTokenSilently);
    setShowForm(false);
    toast.success('Espacio actualizado');
  };

  if (!space) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        {loaded ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">No se encontró el espacio.</p>
            <button
              type="button"
              onClick={() => router.push('/admin/spaces')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
            >
              <ArrowLeft size={16} /> Volver a Espacios
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Loader2 size={18} className="animate-spin" /> Cargando espacio...
          </span>
        )}
      </div>
    );
  }

  const category = (space.category || 'cancha') as SpaceCategory;
  const meta = CATEGORY_META[category] || CATEGORY_META.cancha;
  const facilityPrices = facilityPriceSummary(space);

  return (
    <div className="space-y-4 sm:space-y-6">
      <button
        type="button"
        onClick={() => router.push('/admin/spaces')}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Volver a Espacios
      </button>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${meta.accent}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.badge}`}>
                  {meta.label}
                </span>
                {!space.enabled && space.enabled !== undefined && (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    Deshabilitado
                  </span>
                )}
              </div>
              <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {space.name}
              </h1>
              {space.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{space.description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Edit size={16} /> Editar información
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTab('horarios')}
              className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-black transition-colors ${
                tab === 'horarios'
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={16} /> Horarios y tarifas
            </button>
            <button
              type="button"
              onClick={() => setTab('info')}
              className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-black transition-colors ${
                tab === 'info'
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Info size={16} /> Información
            </button>
          </div>
        </div>
      </section>

      <div className={tab === 'horarios' ? '' : 'hidden'}>
        <AdminSpaceSchedule spaceId={space.id} spaceName={space.name} category={category} />
      </div>

      {tab === 'info' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-black text-slate-900">Información del espacio</h2>
          <p className="mt-1 text-xs text-slate-500">
            Los datos generales y las tarifas por día de quinchos, sedes y piscinas.
          </p>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categoría</dt>
              <dd className="mt-1 text-sm font-bold text-slate-800">{meta.label}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estado</dt>
              <dd className="mt-1 text-sm font-bold text-slate-800">
                {space.enabled === false ? 'Deshabilitado' : 'Habilitado'}
              </dd>
            </div>
            {space.description && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Descripción</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-700">{space.description}</dd>
              </div>
            )}
            {category !== 'cancha' && (
              <>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Users size={11} /> Capacidad
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{space.capacity || 'Sin definir'}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <MapPin size={11} /> Área
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{space.area || 'Sin definir'}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <DollarSign size={11} /> Tarifas
                  </dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {facilityPrices || 'Sin tarifas configuradas'}
                  </dd>
                </div>
                {category === 'quincho' && (space.open_hour || space.close_hour) && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                    <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <Clock size={11} /> Horario de atención
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-800">
                      {space.open_hour ?? 0}:00 – {space.close_hour ?? 0}:00
                    </dd>
                  </div>
                )}
                {(space.features || []).length > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                    <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Características</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {(space.features || []).map((feature: string) => (
                        <span key={feature} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {feature}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </>
            )}
            {category === 'cancha' && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <DollarSign size={11} /> Tarifas
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">
                  Se configuran por franja en “Horarios y tarifas”.
                </dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
          >
            <Edit size={16} /> Editar información
          </button>
        </section>
      )}

      {showForm && (
        <SpaceFormModal
          space={space}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          currentSportCenter={currentSportCenter as any}
        />
      )}
    </div>
  );
}
