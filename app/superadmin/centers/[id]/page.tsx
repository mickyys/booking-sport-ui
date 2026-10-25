"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, Ban, CheckCircle2, ExternalLink, PauseCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiError, CenterStatus, SuperadminCenter, sa } from '@/api/superadminApi';
import { Field, PageHeader, PaymentModeBadge, StatusBadge, fieldCls, formatDateTime } from '@/components/superadmin/ui';
import { FeaturedDialog, StatusDialog } from '@/components/superadmin/CenterDialogs';

const actionBtn = 'inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

export default function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getAccessTokenSilently } = useAuth0();
  const [center, setCenter] = useState<SuperadminCenter | null>(null);
  const [adminCount, setAdminCount] = useState(0);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CenterStatus | null>(null);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { center: c, admin_count } = await sa.getCenter(getAccessTokenSilently, id);
      setCenter(c);
      setAdminCount(admin_count);
      setForm({
        slug: c.slug || '', address: c.address || '', city: c.city || '', image_url: '',
        payment_mode: c.payment_mode || '',
        marketplace_fee_percent: String(c.marketplace_fee_percent ?? 0),
        cancellation_hours: String(c.cancellation_hours ?? 0),
        retention_percent: String(c.retention_percent ?? 0),
        partial_payment_enabled: !!c.partial_payment_enabled,
        partial_payment_percent: String(c.partial_payment_percent ?? 0),
      });
    } catch (e) {
      setError(apiError(e, 'No se pudo cargar el centro'));
    }
  }, [getAccessTokenSilently, id]);

  useEffect(() => { load(); }, [load]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = (k: string) => Number(form[k]);
    for (const k of ['marketplace_fee_percent', 'retention_percent', 'partial_payment_percent']) {
      if (!(pct(k) >= 0 && pct(k) <= 100)) { toast.error('Los porcentajes deben estar entre 0 y 100'); return; }
    }
    const body: Record<string, unknown> = {
      slug: form.slug, address: form.address, city: form.city,
      marketplace_fee_percent: pct('marketplace_fee_percent'),
      cancellation_hours: pct('cancellation_hours'),
      retention_percent: pct('retention_percent'),
      partial_payment_enabled: form.partial_payment_enabled,
      partial_payment_percent: pct('partial_payment_percent'),
    };
    if (form.payment_mode) body.payment_mode = form.payment_mode;
    if (form.image_url) body.image_url = form.image_url;
    setBusy(true);
    try {
      await sa.updateSettings(getAccessTokenSilently, id, body);
      toast.success('Cambios guardados');
      load();
    } catch (err) { toast.error(apiError(err)); } finally { setBusy(false); }
  };

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!center) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;

  const st = (center.status || 'active') as CenterStatus;
  const mpConnected = !!center.mp_user_id?.mp_user_id;
  const publicUrl = `/${center.slug}`;

  return (
    <>
      <Link href="/superadmin/centers" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} aria-hidden="true" /> Centros
      </Link>
      <PageHeader
        title={center.name}
        subtitle={`${center.city || 'Sin ciudad'} · ${center.admin_email || 'sin admin'} · ${adminCount} usuario(s) admin`}
        actions={<a href={publicUrl} target="_blank" rel="noreferrer" className={actionBtn}>Ver público <ExternalLink size={14} aria-hidden="true" /></a>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1" aria-labelledby="estado">
          <h2 id="estado" className="text-sm font-bold text-slate-900">Estado y visibilidad</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={st} />
            <PaymentModeBadge mode={center.payment_mode} />
            {center.is_featured && <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-800"><Star size={14} className="fill-yellow-400 text-yellow-500" aria-hidden="true" />Destacado · {center.featured_priority ?? 0}</span>}
          </div>
          {center.status_reason && st !== 'active' && (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="font-semibold">Motivo:</span> {center.status_reason}<br /><span className="text-xs text-slate-500">{formatDateTime(center.status_changed_at)}</span></p>
          )}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Mercado Pago</dt><dd className={`font-semibold ${mpConnected ? 'text-emerald-700' : 'text-amber-700'}`}>{mpConnected ? 'Conectado' : 'No conectado'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Onboarding</dt><dd className="font-semibold text-slate-800">{center.onboarding_status || 'completo'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Canchas</dt><dd className="font-semibold text-slate-800">{center.courts ?? 0}</dd></div>
          </dl>
          {center.payment_mode === 'pay_online' && !mpConnected && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Este centro cobra online pero no tiene Mercado Pago conectado: no podrá recibir pagos.</p>
          )}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button type="button" className={actionBtn} onClick={() => setFeaturedOpen(true)}><Star size={16} aria-hidden="true" /> Destacado</button>
            {st === 'active' ? (
              <>
                <button type="button" className={actionBtn} onClick={() => setStatusTarget('suspended')}><PauseCircle size={16} aria-hidden="true" /> Suspender</button>
                <button type="button" className={`${actionBtn} !border-red-200 !text-red-700 hover:!bg-red-50`} onClick={() => setStatusTarget('blocked')}><Ban size={16} aria-hidden="true" /> Bloquear</button>
              </>
            ) : (
              <button type="button" className={`${actionBtn} !border-emerald-200 !text-emerald-800 hover:!bg-emerald-50`} onClick={() => setStatusTarget('active')}><CheckCircle2 size={16} aria-hidden="true" /> Reactivar</button>
            )}
          </div>
        </section>

        <form onSubmit={save} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2" aria-label="Configuración del centro">
          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm font-bold text-slate-900">Datos generales</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" htmlFor="slug"><input id="slug" value={String(form.slug)} onChange={set('slug')} className={fieldCls} /></Field>
              <Field label="Ciudad" htmlFor="city"><input id="city" value={String(form.city)} onChange={set('city')} className={fieldCls} /></Field>
              <div className="sm:col-span-2"><Field label="Dirección" htmlFor="address"><input id="address" value={String(form.address)} onChange={set('address')} className={fieldCls} /></Field></div>
              <div className="sm:col-span-2"><Field label="URL de imagen" htmlFor="image_url" hint="Déjalo vacío para no cambiarla."><input id="image_url" type="url" value={String(form.image_url)} onChange={set('image_url')} className={fieldCls} /></Field></div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm font-bold text-slate-900">Pagos y comisión</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Modo de pago" htmlFor="payment_mode">
                <select id="payment_mode" value={String(form.payment_mode)} onChange={set('payment_mode')} className={fieldCls}>
                  <option value="">Sin definir</option>
                  <option value="pay_at_center">Paga en el centro</option>
                  <option value="pay_online">Pago online</option>
                </select>
              </Field>
              <Field label="Comisión marketplace (%)" htmlFor="fee" hint="Aplica solo con pago online."><input id="fee" type="number" min={0} max={100} step={1} value={String(form.marketplace_fee_percent)} onChange={set('marketplace_fee_percent')} className={fieldCls} /></Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-sm font-bold text-slate-900">Políticas de reserva</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Horas mínimas para cancelar" htmlFor="ch"><input id="ch" type="number" min={0} value={String(form.cancellation_hours)} onChange={set('cancellation_hours')} className={fieldCls} /></Field>
              <Field label="Retención al cancelar tarde (%)" htmlFor="rp"><input id="rp" type="number" min={0} max={100} value={String(form.retention_percent)} onChange={set('retention_percent')} className={fieldCls} /></Field>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
                <input type="checkbox" checked={!!form.partial_payment_enabled} onChange={set('partial_payment_enabled')} className="h-5 w-5 accent-emerald-700" /> Permitir pago parcial
              </label>
              <Field label="Porcentaje de pago parcial (%)" htmlFor="pp"><input id="pp" type="number" min={0} max={100} disabled={!form.partial_payment_enabled} value={String(form.partial_payment_percent)} onChange={set('partial_payment_percent')} className={fieldCls} /></Field>
            </div>
          </fieldset>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={busy} className="h-11 cursor-pointer rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>

      <StatusDialog
        center={statusTarget ? center : null}
        target={statusTarget ?? 'active'}
        onClose={() => setStatusTarget(null)}
        onConfirm={async (s, reason) => {
          try { await sa.setStatus(getAccessTokenSilently, id, s, reason); toast.success('Estado actualizado'); setStatusTarget(null); load(); }
          catch (e) { toast.error(apiError(e)); }
        }}
      />
      <FeaturedDialog
        center={featuredOpen ? center : null}
        onClose={() => setFeaturedOpen(false)}
        onConfirm={async (v) => {
          try { await sa.setFeatured(getAccessTokenSilently, id, v); toast.success('Destacado actualizado'); setFeaturedOpen(false); load(); }
          catch (e) { toast.error(apiError(e)); }
        }}
      />
    </>
  );
}
