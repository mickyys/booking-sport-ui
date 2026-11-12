"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Mail, Plus } from 'lucide-react';
import { apiError, sa, SuperadminCenter } from '@/api/superadminApi';
import { PageHeader, PaymentModeBadge } from '@/components/superadmin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STEPS = ['Contacto', 'Espacios', 'Modelo de cobro', 'Imagen', 'Finalizar'];
const LIMIT = 100;

export default function SuperadminOnboardingPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [items, setItems] = useState<SuperadminCenter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sa.listCenters(getAccessTokenSilently, { onboarding: 'pending', page: 1, limit: LIMIT });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      toast.error(apiError(e, 'No se pudo cargar el onboarding pendiente'));
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => { load(); }, [load]);

  const resend = async (center: SuperadminCenter) => {
    setResendingId(center.id);
    try {
      const res = await sa.resendAdminInvite(getAccessTokenSilently, center.id);
      if (res.email_sent) toast.success(`Invitación reenviada a ${center.admin_email}`);
      else toast.warning('Se generó el enlace pero no se pudo enviar el correo');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo reenviar la invitación'));
    } finally {
      setResendingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Onboarding de administradores"
        subtitle="Centros creados que aún esperan que su administrador complete la configuración."
        actions={
          <Link
            href="/superadmin/centers/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <Plus size={16} aria-hidden="true" /> Nuevo centro
          </Link>
        }
      />

      <p className="mb-4 text-sm text-slate-600">
        {loading ? 'Cargando…' : `${total} centro${total === 1 ? '' : 's'} pendiente${total === 1 ? '' : 's'}`}
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro</TableHead>
              <TableHead>Administrador</TableHead>
              <TableHead>Paso</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead className="text-right"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><div className="h-6 animate-pulse rounded bg-slate-100" /></TableCell></TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-600">
                  <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 size={16} aria-hidden="true" /> No hay onboardings pendientes.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => {
                const step = Math.min(Math.max(c.onboarding_step ?? 0, 0), STEPS.length);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-600">{c.city || '—'} · {c.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{c.admin_email || 'sin admin'}</TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {step === 0 ? 'Sin empezar' : `${STEPS[step - 1]} (${step}/${STEPS.length})`}
                    </TableCell>
                    <TableCell><PaymentModeBadge mode={c.payment_mode} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void resend(c)}
                          disabled={resendingId === c.id || !c.admin_email}
                          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Mail size={16} aria-hidden="true" /> {resendingId === c.id ? 'Enviando…' : 'Reenviar'}
                        </button>
                        <Link
                          href={`/superadmin/centers/${c.id}/onboarding`}
                          className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Ver <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
