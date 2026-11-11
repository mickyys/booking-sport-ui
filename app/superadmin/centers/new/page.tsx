"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Mail, Plug } from 'lucide-react';
import { apiError, sa } from '@/api/superadminApi';
import { Field, PageHeader, fieldCls } from '@/components/superadmin/ui';

interface CreatedCenter {
  id: string;
  name: string;
  emailSent: boolean;
  email: string;
}

export default function NewCenterPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedCenter | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState<boolean | null>(null);
  const [f, setF] = useState({ nombre: '', rut: '', direccion: '', ciudad: '', email: '', slug: '', latitud: '', longitud: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if ((f.latitud === '') !== (f.longitud === '')) {
      setError('Ingresa latitud y longitud juntas, o deja ambas vacías.');
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        nombre: f.nombre.trim(), rut: f.rut.trim(), direccion: f.direccion.trim(), ciudad: f.ciudad.trim(),
        email: f.email.trim(), slug: f.slug.trim() || undefined,
      };
      if (f.latitud !== '') { body.latitud = Number(f.latitud); body.longitud = Number(f.longitud); }
      const center = await sa.createCenter(getAccessTokenSilently, body);
      setCreated({ id: center.id, name: center.name, emailSent: center.email_sent !== false, email: f.email.trim() });
      toast.success(`Centro "${center.name}" creado`);
    } catch (err) {
      setError(apiError(err, 'No se pudo crear el centro'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!created) return;
    setResending(true);
    try {
      const res = await sa.resendAdminInvite(getAccessTokenSilently, created.id);
      setResent(res.email_sent);
      if (res.email_sent) {
        toast.success('Invitación reenviada');
      } else {
        toast.warning('Se generó el enlace pero no se pudo enviar el correo');
      }
    } catch (err) {
      toast.error(apiError(err, 'No se pudo reenviar la invitación'));
    } finally {
      setResending(false);
    }
  };

  // ---------- Resultado del alta ----------
  if (created) {
    return (
      <>
        <PageHeader title="Centro creado" subtitle="El administrador ya puede entrar y completar el onboarding." />
        <div className="max-w-3xl space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-emerald-100 p-2">
                <CheckCircle2 size={22} className="text-emerald-700" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{created.name}</h2>
                <p className="text-sm text-slate-600">
                  Administrador: <span className="font-semibold text-slate-800">{created.email}</span>
                </p>
              </div>
            </div>

            <div
              role="status"
              className={`mt-4 rounded-lg p-3 text-sm ${created.emailSent ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
            >
              {created.emailSent ? (
                <p className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Enviamos el correo de bienvenida con el enlace para que defina su contraseña. Si no llega, usa “Reenviar invitación”.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    El centro se creó, pero <strong>no se pudo enviar el correo</strong> de bienvenida.
                  </p>
                  <button
                    type="button"
                    onClick={() => void resend()}
                    disabled={resending}
                    className="h-10 cursor-pointer rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resending ? 'Reenviando…' : 'Reenviar invitación'}
                  </button>
                  {resent === true && <p className="text-xs font-semibold">Correo reenviado correctamente.</p>}
                  {resent === false && <p className="text-xs font-semibold">Sigue fallando el envío: revisa los logs de Mailgun.</p>}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link
                href={`/superadmin/centers/${created.id}/onboarding`}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plug size={16} aria-hidden="true" /> Ver onboarding del admin
              </Link>
              <Link
                href={`/superadmin/centers/${created.id}`}
                className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Configurar centro
              </Link>
              <button
                type="button"
                onClick={() => { setCreated(null); setResent(null); setF({ nombre: '', rut: '', direccion: '', ciudad: '', email: '', slug: '', latitud: '', longitud: '' }); }}
                className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Crear otro centro
              </button>
            </div>
          </section>
        </div>
      </>
    );
  }

  // ---------- Formulario ----------
  return (
    <>
      <PageHeader
        title="Nuevo centro deportivo"
        subtitle="Se crea el centro, la cuenta del administrador y se le envía un correo para definir su contraseña."
      />
      <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold text-slate-900">Datos del centro</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre *" htmlFor="nombre"><input id="nombre" required maxLength={100} value={f.nombre} onChange={set('nombre')} className={fieldCls} /></Field>
            <Field label="RUT *" htmlFor="rut"><input id="rut" required value={f.rut} onChange={set('rut')} placeholder="12.345.678-5" className={fieldCls} /></Field>
            <Field label="Dirección *" htmlFor="direccion"><input id="direccion" required value={f.direccion} onChange={set('direccion')} className={fieldCls} /></Field>
            <Field label="Ciudad" htmlFor="ciudad"><input id="ciudad" maxLength={100} value={f.ciudad} onChange={set('ciudad')} className={fieldCls} /></Field>
            <Field label="Latitud" htmlFor="lat"><input id="lat" type="number" step="any" min={-90} max={90} value={f.latitud} onChange={set('latitud')} className={fieldCls} /></Field>
            <Field label="Longitud" htmlFor="lng" hint="Latitud y longitud van juntas, o ambas vacías."><input id="lng" type="number" step="any" min={-180} max={180} value={f.longitud} onChange={set('longitud')} className={fieldCls} /></Field>
            <div className="sm:col-span-2">
              <Field label="Slug (URL)" htmlFor="slug" hint="Opcional. Si se omite se genera desde el nombre."><input id="slug" value={f.slug} onChange={set('slug')} className={fieldCls} /></Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-100 pt-5">
          <legend className="text-sm font-bold text-slate-900">Administrador</legend>
          <Field
            label="Email del administrador *"
            htmlFor="email"
            hint="Un correo administra un solo centro. Le enviaremos un enlace para que defina su contraseña y complete el onboarding."
          >
            <input id="email" type="email" required value={f.email} onChange={set('email')} className={fieldCls} />
          </Field>
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            No necesitas definir una clave: la cuenta se crea con una clave aleatoria y el administrador define la suya desde el correo.
          </p>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link href="/superadmin/centers" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link>
          <button type="submit" disabled={busy} className="h-11 cursor-pointer rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Creando…' : 'Crear centro'}</button>
        </div>
      </form>
    </>
  );
}
