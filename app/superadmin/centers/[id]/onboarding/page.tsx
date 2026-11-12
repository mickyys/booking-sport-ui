"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, Mail, Rocket, Send } from 'lucide-react';
import { apiError, CommercialView, sa, SuperadminCenter } from '@/api/superadminApi';
import { PageHeader, PaymentModeBadge } from '@/components/superadmin/ui';

const STEPS = ['Contacto', 'Espacios', 'Modelo de cobro', 'Imagen', 'Finalizar'];

const actionBtn =
  'inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60';

export default function CenterOnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const { getAccessTokenSilently } = useAuth0();

  const [center, setCenter] = useState<SuperadminCenter | null>(null);
  const [commercial, setCommercial] = useState<CommercialView | null>(null);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [origin, setOrigin] = useState('');
  const [forceOpen, setForceOpen] = useState(false);
  const [forceReason, setForceReason] = useState('');
  const [forcing, setForcing] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const load = useCallback(async () => {
    try {
      const { center: c } = await sa.getCenter(getAccessTokenSilently, id);
      setCenter(c);
      try {
        setCommercial(await sa.commercial(getAccessTokenSilently, id));
      } catch {
        // Sin modelo comercial el centro opera con el flujo legacy.
        setCommercial(null);
      }
    } catch (e) {
      setError(apiError(e, 'No se pudo cargar el centro'));
    }
  }, [getAccessTokenSilently, id]);

  useEffect(() => { load(); }, [load]);

  const pending = (center?.onboarding_status || '') === 'pending';
  // Si el onboarding ya está completo se muestran todas las etapas hechas,
  // aunque el centro sea legacy y no tenga onboarding_step guardado.
  const savedStep = Math.min(Math.max(center?.onboarding_step ?? 0, 0), STEPS.length);
  const step = pending ? savedStep : STEPS.length;

  const totalSpaces = useMemo(() => {
    if (!center) return 0;
    if (center.space_templates && center.space_templates.length > 0) {
      return center.space_templates.reduce((acc, t) => acc + (t.cantidad ?? 0), 0);
    }
    return center.courts ?? 0;
  }, [center]);

  const mpConnected = !!center?.mp_user_id?.mp_user_id;
  const subscriptionActive = commercial?.subscription?.status === 'active';
  const loginUrl = `${origin || ''}/admin`;

  const missing: string[] = [];
  if (center?.payment_mode === 'pay_online' && !mpConnected) missing.push('Conectar Mercado Pago (el centro cobra online).');
  if (center?.payment_mode === 'pay_at_center' && commercial && !subscriptionActive) missing.push('Activar la suscripción mensual.');
  if (commercial && !commercial.published) missing.push('Publicar el centro para que aparezca en el marketplace.');

  const resend = async () => {
    setResending(true);
    try {
      const res = await sa.resendAdminInvite(getAccessTokenSilently, id);
      if (res.email_sent) toast.success('Invitación reenviada');
      else toast.warning('Se generó el enlace pero no se pudo enviar el correo');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo reenviar la invitación'));
    } finally {
      setResending(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      setCommercial(await sa.publishCenter(getAccessTokenSilently, id));
      toast.success('Centro publicado');
    } catch (e) {
      toast.error(apiError(e, 'No se pudo publicar el centro'));
    } finally {
      setPublishing(false);
    }
  };

  const forceComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forceReason.trim()) return;
    setForcing(true);
    try {
      await sa.completeOnboarding(getAccessTokenSilently, id, forceReason.trim());
      toast.success('Onboarding marcado como completo');
      setForceOpen(false);
      setForceReason('');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'No se pudo completar el onboarding'));
    } finally {
      setForcing(false);
    }
  };

  const copyLogin = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success('Enlace de acceso copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (!center) return <div className="h-64 animate-pulse rounded-xl bg-slate-200" />;

  return (
    <>
      <Link href={`/superadmin/centers/${id}`} className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} aria-hidden="true" /> Volver al centro
      </Link>

      <PageHeader
        title={`Onboarding · ${center.name}`}
        subtitle={`${center.admin_email || 'sin administrador'} · ${center.slug}`}
        actions={
          <a href={`/${center.slug}`} target="_blank" rel="noreferrer" className={actionBtn}>
            Ver público <ExternalLink size={14} aria-hidden="true" />
          </a>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Estado del wizard */}
          <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="estado-wizard">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="estado-wizard" className="text-sm font-bold text-slate-900">Configuración del centro</h2>
              {pending ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25">Pendiente</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Completado</span>
              )}
            </div>

            <ol className="mt-4 space-y-2" aria-label="Etapas del onboarding">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const done = n <= step;
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        done ? 'border-emerald-600 bg-emerald-100 text-emerald-700' : 'border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {done ? <Check size={14} /> : n}
                    </span>
                    <span className={done ? 'font-semibold text-slate-800' : 'text-slate-500'}>{label}</span>
                  </li>
                );
              })}
            </ol>

            <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
              <Row label="Teléfono" value={center.contact?.phone || '—'} />
              <Row label="Espacios" value={`${totalSpaces}`} />
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-600">Modelo de cobro</dt>
                <dd><PaymentModeBadge mode={center.payment_mode} /></dd>
              </div>
              <Row label="Mercado Pago" value={mpConnected ? 'Conectado' : 'No conectado'} />
              <Row label="Primer mes gratis" value={center.first_month_free ? 'Activado' : 'No'} />
              <Row label="Paso guardado" value={step > 0 ? `${step} de ${STEPS.length}` : 'Sin empezar'} />
            </dl>
          </section>

          {/* Pendientes */}
          <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="pendientes">
            <h2 id="pendientes" className="text-sm font-bold text-slate-900">Qué falta</h2>
            {pending && (
              <p className="mt-1 text-sm text-slate-600">
                El administrador todavía no terminó el wizard: al entrar a <span className="font-mono text-xs">/admin</span> se le
                redirige automáticamente a <span className="font-mono text-xs">/admin/onboarding</span>.
              </p>
            )}
            {pending && (
              <div className="mt-3">
                {!forceOpen ? (
                  <button type="button" onClick={() => setForceOpen(true)} className={actionBtn}>
                    <CheckCircle2 size={16} aria-hidden="true" /> Marcar onboarding completo
                  </button>
                ) : (
                  <form onSubmit={forceComplete} className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <label htmlFor="force-reason" className="block text-sm font-semibold text-amber-900">
                      Motivo (queda en la auditoría)
                    </label>
                    <textarea
                      id="force-reason"
                      required
                      rows={2}
                      value={forceReason}
                      onChange={(e) => setForceReason(e.target.value)}
                      placeholder="Ej: el administrador configuró el centro desde la app mobile"
                      className="w-full rounded-lg border border-amber-300 bg-white p-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-amber-600"
                    />
                    <p className="text-xs text-amber-900">
                      Cierra el onboarding aunque falten datos. El administrador entrará directo al panel.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={forcing || !forceReason.trim()}
                        className="h-10 cursor-pointer rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {forcing ? 'Guardando…' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setForceOpen(false); setForceReason(''); }}
                        className="h-10 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {missing.length === 0 && !pending ? (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} aria-hidden="true" /> No hay pendientes: el centro está listo para operar.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {missing.map((m) => (
                  <li key={m} className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /> {m}
                  </li>
                ))}
              </ul>
            )}
            {commercial && !commercial.published && commercial.publish.missing.length > 0 && (
              <p className="mt-2 text-xs text-slate-600">
                Requisitos de publicación: {commercial.publish.missing.join(', ')}.
              </p>
            )}
            {commercial && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => void publish()}
                  disabled={publishing || commercial.published || !commercial.publish.can_publish}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  title={commercial.published ? 'El centro ya está publicado' : commercial.publish.missing.join(', ')}
                >
                  <Rocket size={16} aria-hidden="true" /> {commercial.published ? 'Publicado' : publishing ? 'Publicando…' : 'Publicar centro'}
                </button>
                <span className="text-xs text-slate-600">Ciclo de vida: {commercial.lifecycle_status}</span>
              </div>
            )}
          </section>
        </div>

        {/* Administrador */}
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="admin">
          <h2 id="admin" className="text-sm font-bold text-slate-900">Administrador</h2>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-800">{center.admin_email || 'Sin correo registrado'}</p>
            <p className="text-xs text-slate-600">Enlace de acceso: <span className="font-mono">{loginUrl}</span></p>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => void resend()} disabled={resending} className={`${actionBtn} w-full justify-center`}>
              <Mail size={16} aria-hidden="true" /> {resending ? 'Reenviando…' : 'Reenviar invitación'}
            </button>
            <p className="text-xs text-slate-600">
              Genera un enlace nuevo para definir su contraseña y reenvía el correo de bienvenida.
            </p>
            <button type="button" onClick={() => void copyLogin()} className={`${actionBtn} w-full justify-center`}>
              <Copy size={16} aria-hidden="true" /> Copiar enlace de acceso
            </button>
            <a href={loginUrl} target="_blank" rel="noreferrer" className={`${actionBtn} w-full justify-center`}>
              <Send size={16} aria-hidden="true" /> Abrir panel del admin
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-slate-600">{label}</dt>
    <dd className="font-semibold text-slate-800">{value}</dd>
  </div>
);
