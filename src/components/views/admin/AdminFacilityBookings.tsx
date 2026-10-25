"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Users, Waves, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import {
  cancelAdminFacilityBooking,
  getAdminFacilityBookings,
  type FacilityBookingDay,
} from '@/api/bookingApi';

type Tab = 'active' | 'past' | 'cancelled';

const STATUS_LABEL: Record<FacilityBookingDay['status'], { label: string; classes: string }> = {
  confirmed: { label: 'Confirmada', classes: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'Pago pendiente', classes: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'Cancelada', classes: 'bg-slate-200 text-slate-700' },
  expired: { label: 'Expirada', classes: 'bg-slate-200 text-slate-700' },
};

const money = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

export const AdminFacilityBookings: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [bookings, setBookings] = useState<FacilityBookingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      setBookings(await getAdminFacilityBookings(token));
    } catch {
      toast.error('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const today = todayKey();
    const list = bookings.filter((b) => {
      const isActive = b.status === 'confirmed' || b.status === 'pending';
      if (tab === 'cancelled') return !isActive;
      if (tab === 'past') return isActive && b.local_date < today;
      return isActive && b.local_date >= today;
    });
    return list.sort((a, b) => (tab === 'active' ? a.local_date.localeCompare(b.local_date) : b.local_date.localeCompare(a.local_date)));
  }, [bookings, tab]);

  const handleCancel = async (b: FacilityBookingDay) => {
    if (!window.confirm(`¿Cancelar la reserva de ${b.customer_name} para el ${b.local_date}? El día quedará libre.`)) return;
    setCancellingId(b.id);
    try {
      await cancelAdminFacilityBooking(b.id, await getAccessTokenSilently());
      toast.success('Reserva cancelada');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo cancelar la reserva');
    } finally {
      setCancellingId(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Próximas' },
    { key: 'past', label: 'Pasadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900">Reservas de sedes y piscinas</h1>
      <p className="mb-5 text-sm text-slate-600">Una reserva por día. Las reservas pagadas online con pago pendiente expiran a los 15 minutos.</p>

      <div className="mb-4 flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors ${
              tab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-slate-600" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando reservas
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">No hay reservas en esta categoría.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((b) => {
            const status = STATUS_LABEL[b.status];
            const canCancel = b.status === 'confirmed' || b.status === 'pending';
            return (
              <li key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-bold text-slate-900">
                      {b.space_type === 'piscina' ? <Waves className="h-4 w-4" aria-hidden="true" /> : <Building className="h-4 w-4" aria-hidden="true" />}
                      {b.space_name} — {b.local_date}
                    </p>
                    <p className="text-sm text-slate-700">
                      {b.customer_name} · {b.customer_phone} · {b.customer_email}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" />{b.guests} personas</span>
                      <span>{b.payment_method === 'mercadopago' ? 'Mercado Pago' : 'Pago en el centro'}</span>
                      <span>Total {money(b.price)}</span>
                      {b.paid_amount > 0 && <span>Pagado {money(b.paid_amount)}</span>}
                      {b.pending_amount > 0 && b.status === 'confirmed' && <span>Por cobrar {money(b.pending_amount)}</span>}
                      <span className="font-mono">{b.booking_code}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.classes}`}>{status.label}</span>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b)}
                        disabled={cancellingId === b.id}
                        className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === b.id ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminFacilityBookings;
