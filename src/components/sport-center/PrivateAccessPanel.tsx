"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AccessApiError,
  clearAccessToken,
  confirmAccessCode,
  getAccessToken,
  requestAccessCode,
  saveAccessToken,
  setActiveAccessCenter,
  submitAccessRequest,
  validateAccessToken,
} from '@/api/accessApi';
import type { AccessField, SportCenter } from '@/types';
import { formatRUT, validateRUT } from '@/utils/rut';

/** Indica si el visitante ya tiene acceso vigente al centro privado. */
export function useCenterAccess(center: SportCenter | null) {
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const isPrivate = !!center?.isPrivate;
  const centerId = center?.id || '';
  const slug = center?.slug || '';

  const refresh = useCallback(async () => {
    if (!isPrivate || !centerId) {
      setHasAccess(false);
      return;
    }
    setActiveAccessCenter(centerId);
    const token = getAccessToken(centerId);
    if (!token) {
      setHasAccess(false);
      return;
    }
    setChecking(true);
    try {
      await validateAccessToken(slug, token);
      setHasAccess(true);
    } catch {
      clearAccessToken(centerId);
      setHasAccess(false);
    } finally {
      setChecking(false);
    }
  }, [isPrivate, centerId, slug]);

  useEffect(() => {
    refresh();
    window.addEventListener('access-changed', refresh);
    return () => window.removeEventListener('access-changed', refresh);
  }, [refresh]);

  return { isPrivate, hasAccess: !isPrivate || hasAccess, checking, refresh };
}

const overlay = 'fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4';
const card = 'max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl';

/** Modal con el formulario de solicitud de acceso ("Registrarse"). */
export const RegisterModal: React.FC<{ center: SportCenter; onClose: () => void }> = ({ center, onClose }) => {
  const form = center.accessForm;
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRUT(rut)) {
      toast.error('RUT inválido');
      return;
    }
    if (siteKey && !turnstile) {
      toast.error('Completa la verificación de seguridad');
      return;
    }
    setBusy(true);
    try {
      const custom: Record<string, string> = {};
      (form?.fields || []).forEach((f) => {
        if (f.key !== 'rut' && f.key !== 'email') custom[f.key] = answers[f.key] || '';
      });
      await submitAccessRequest(center.slug, { rut, email, answers: custom, turnstile_token: turnstile || undefined });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderField = (field: AccessField) => {
    const id = `access-${field.key}`;
    const common = { id, name: field.key, required: field.required, placeholder: field.placeholder };
    if (field.key === 'rut') {
      return <Input {...common} type="text" autoComplete="off" value={rut} onChange={(e) => setRut(formatRUT(e.target.value))} />;
    }
    if (field.key === 'email') {
      return (
        <Input {...common} type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
          autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
      );
    }
    const value = answers[field.key] || '';
    const set = (v: string) => setAnswers((a) => ({ ...a, [field.key]: v }));
    if (field.type === 'textarea') {
      return <textarea {...common} rows={3} value={value} onChange={(e) => set(e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />;
    }
    if (field.type === 'select') {
      return (
        <select {...common} value={value} onChange={(e) => set(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="">Selecciona…</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.type === 'number') return <Input {...common} type="number" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} />;
    if (field.type === 'email') return <Input {...common} type="email" inputMode="email" autoComplete="email" value={value} onChange={(e) => set(e.target.value)} />;
    return <Input {...common} type="text" value={value} onChange={(e) => set(e.target.value)} />;
  };

  return (
    <div className={overlay} role="dialog" aria-modal="true" aria-labelledby="register-title" onClick={onClose}>
      <div className={card} onClick={(e) => e.stopPropagation()}>
        <h2 id="register-title" className="mb-1 text-lg font-bold text-slate-900">{form?.title || 'Registrarse'}</h2>
        {submitted ? (
          <>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" aria-hidden />
              <p>Recibimos tu solicitud. Te avisaremos por correo cuando el centro la revise.</p>
            </div>
            <Button className="mt-4 w-full" onClick={onClose}>Entendido</Button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3" autoComplete="on">
            {form?.description && <p className="text-sm text-slate-600">{form.description}</p>}
            {(form?.fields || []).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`access-${f.key}`}>{f.label}{f.required ? ' *' : ''}</Label>
                {renderField(f)}
                {f.help && <p className="text-xs text-slate-500">{f.help}</p>}
              </div>
            ))}
            {siteKey && <Turnstile siteKey={siteKey} onSuccess={setTurnstile} onExpire={() => setTurnstile(null)} onError={() => setTurnstile(null)} />}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitud'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/**
 * Paso previo a la reserva en un centro privado: pide el RUT, envía el código
 * al correo registrado y entrega el token de acceso al confirmarlo.
 */
export const AccessVerifyModal: React.FC<{
  center: SportCenter;
  onClose: () => void;
  onRegister?: () => void;
}> = ({ center, onClose, onRegister }) => {
  const [rut, setRut] = useState('');
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const phone = center.contact?.phone || center.phone;
  const contactEmail = center.contact?.email || center.email;

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateRUT(rut)) {
      toast.error('RUT inválido');
      return;
    }
    setBusy(true);
    setNotFound(false);
    try {
      const res = await requestAccessCode(center.slug, rut);
      setVerificationId(res.verification_id);
      setMaskedEmail(res.masked_email);
      setCode('');
      toast.success(`Enviamos un código a ${res.masked_email}`);
    } catch (err: any) {
      if (err instanceof AccessApiError && err.status === 404) setNotFound(true);
      else toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await confirmAccessCode(center.slug, verificationId, code);
      saveAccessToken(center.id, res.access_token, res.expires_at, res.applicant);
      window.dispatchEvent(new Event('access-changed'));
      toast.success('Acceso verificado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={overlay} role="dialog" aria-modal="true" aria-labelledby="verify-title" onClick={onClose}>
      <div className={card} onClick={(e) => e.stopPropagation()}>
        <h2 id="verify-title" className="mb-1 text-lg font-bold text-slate-900">Centro privado</h2>
        <p className="mb-4 text-sm text-slate-600">
          Para reservar en {center.name} verifica tu RUT. Te enviaremos un código al correo con el que fuiste aprobado.
        </p>

        {!verificationId ? (
          <form onSubmit={sendCode} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="access-verify-rut">RUT</Label>
              <Input id="access-verify-rut" name="rut" type="text" autoComplete="off" placeholder="12.345.678-9"
                value={rut} onChange={(e) => { setRut(formatRUT(e.target.value)); setNotFound(false); }} required />
            </div>
            {notFound && (
              <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <p>No encontramos un acceso aprobado con ese RUT. Regístrate o contacta al centro deportivo.</p>
                <div className="flex flex-wrap gap-2">
                  {onRegister && center.accessForm?.enabled && (
                    <Button type="button" size="sm" onClick={onRegister}>Registrarse</Button>
                  )}
                  {phone && <a href={`tel:${phone}`} className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium">Llamar</a>}
                  {contactEmail && <a href={`mailto:${contactEmail}`} className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium">Escribir</a>}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={busy}>{busy ? 'Enviando…' : 'Enviar código'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={confirm} className="space-y-3">
            <p className="text-sm text-slate-700">Ingresa el código de 6 dígitos enviado a {maskedEmail}.</p>
            <div className="space-y-1">
              <Label htmlFor="access-code">Código</Label>
              <Input id="access-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code"
                pattern="[0-9]{6}" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => sendCode()}>Reenviar</Button>
              <Button type="submit" className="flex-1" disabled={busy || code.length !== 6}>
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="mr-1 h-4 w-4" aria-hidden />}
                Validar y continuar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
