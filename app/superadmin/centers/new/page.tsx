"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { apiError, sa } from '@/api/superadminApi';
import { Field, PageHeader, fieldCls } from '@/components/superadmin/ui';

export default function NewCenterPage() {
  const { getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ nombre: '', rut: '', direccion: '', ciudad: '', email: '', slug: '', clave: '', latitud: '', longitud: '' });
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
        email: f.email.trim(), slug: f.slug.trim() || undefined, clave: f.clave || undefined,
      };
      if (f.latitud !== '') { body.latitud = Number(f.latitud); body.longitud = Number(f.longitud); }
      const created = await sa.createCenter(getAccessTokenSilently, body);
      toast.success(`Centro "${created.name}" creado`);
      router.push(`/superadmin/centers/${created.id}`);
    } catch (err) {
      setError(apiError(err, 'No se pudo crear el centro'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Nuevo centro deportivo" subtitle="Se crea el centro y se asigna el rol de administrador al correo indicado." />
      <form onSubmit={submit} className="max-w-3xl space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *" htmlFor="nombre"><input id="nombre" required maxLength={100} value={f.nombre} onChange={set('nombre')} className={fieldCls} /></Field>
          <Field label="RUT *" htmlFor="rut"><input id="rut" required value={f.rut} onChange={set('rut')} placeholder="12.345.678-5" className={fieldCls} /></Field>
          <Field label="Dirección *" htmlFor="direccion"><input id="direccion" required value={f.direccion} onChange={set('direccion')} className={fieldCls} /></Field>
          <Field label="Ciudad" htmlFor="ciudad"><input id="ciudad" maxLength={100} value={f.ciudad} onChange={set('ciudad')} className={fieldCls} /></Field>
          <Field label="Latitud" htmlFor="lat"><input id="lat" type="number" step="any" min={-90} max={90} value={f.latitud} onChange={set('latitud')} className={fieldCls} /></Field>
          <Field label="Longitud" htmlFor="lng"><input id="lng" type="number" step="any" min={-180} max={180} value={f.longitud} onChange={set('longitud')} className={fieldCls} /></Field>
          <Field label="Email del administrador *" htmlFor="email"><input id="email" type="email" required value={f.email} onChange={set('email')} className={fieldCls} /></Field>
          <Field label="Slug (URL)" htmlFor="slug" hint="Opcional. Si se omite se genera desde el nombre."><input id="slug" value={f.slug} onChange={set('slug')} className={fieldCls} /></Field>
        </div>
        <Field label="Clave inicial" htmlFor="clave" hint="Solo si el correo aún no tiene cuenta: mínimo 8 caracteres con mayúscula, minúscula y número. Se envía un enlace para que el admin defina la suya.">
          <input id="clave" type="password" autoComplete="new-password" value={f.clave} onChange={set('clave')} className={fieldCls} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link href="/superadmin/centers" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link>
          <button type="submit" disabled={busy} className="h-11 cursor-pointer rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Creando…' : 'Crear centro'}</button>
        </div>
      </form>
    </>
  );
}
