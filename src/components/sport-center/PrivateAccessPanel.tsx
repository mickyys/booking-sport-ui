"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { CheckCircle2, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
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

type Mode = 'request' | 'verify';

export const PrivateAccessPanel: React.FC<{ center: SportCenter; checking?: boolean }> = ({ center, checking }) => {
  const form = center.accessForm;
  const formEnabled = !!form?.enabled;
  const [mode, setMode] = useState<Mode>(formEnabled ? 'request' : 'verify');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');

  const checkRut = () => {
    if (!validateRUT(rut)) {
      toast.error('RUT inválido');
      return false;
    }
    return true;
  };

  const onSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRut()) return;
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

  const onRequestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!checkRut()) return;
    setBusy(true);
    try {
      const res = await requestAccessCode(center.slug, rut);
      setVerificationId(res.verification_id);
      setMaskedEmail(res.masked_email);
      setCode('');
      toast.success(`Enviamos un código a ${res.masked_email}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await confirmAccessCode(center.slug, verificationId, code);
      saveAccessToken(center.id, res.access_token, res.expires_at);
      toast.success('Acceso verificado. Ya puedes reservar.');
      window.dispatchEvent(new Event('access-changed'));
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
      return (
        <Input {...common} type="text" inputMode="text" autoComplete="off" value={rut}
          onChange={(e) => setRut(formatRUT(e.target.value))} />
      );
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
      return (
        <textarea {...common} rows={3} value={value} onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
      );
    }
    if (field.type === 'select') {
      return (
        <select {...common} value={value} onChange={(e) => set(e.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="">Selecciona…</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.type === 'number') {
      return <Input {...common} type="number" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} />;
    }
    if (field.type === 'email') {
      return <Input {...common} type="email" inputMode="email" autoComplete="email" value={value} onChange={(e) => set(e.target.value)} />;
    }
    return <Input {...common} type="text" value={value} onChange={(e) => set(e.target.value)} />;
  };

  return (
    <section aria-labelledby="acceso-privado" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-5 w-5 text-amber-700" aria-hidden />
        <h2 id="acceso-privado" className="text-lg font-bold text-slate-900">Centro privado</h2>
        {checking && <Loader2 className="h-4 w-4 animate-spin text-slate-500" aria-label="Verificando acceso" />}
      </div>
      <p className="mb-4 text-sm text-slate-700">
        Puedes ver horarios y precios. Para reservar necesitas acceso aprobado por el centro y verificar tu RUT.
      </p>

      <div className="mb-4 flex gap-2" role="tablist">
        {formEnabled && (
          <Button type="button" size="sm" variant={mode === 'request' ? 'default' : 'outline'} onClick={() => setMode('request')}>
            Solicitar acceso
          </Button>
        )}
        <Button type="button" size="sm" variant={mode === 'verify' ? 'default' : 'outline'} onClick={() => setMode('verify')}>
          Ya fui aprobado
        </Button>
      </div>

      {mode === 'request' && formEnabled && (
        submitted ? (
          <div className="flex items-start gap-2 rounded-xl bg-white p-4 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" aria-hidden />
            <p>Recibimos tu solicitud. Te avisaremos por correo cuando el centro la revise.</p>
          </div>
        ) : (
          <form onSubmit={onSubmitRequest} className="space-y-3" autoComplete="on">
            {form?.title && <h3 className="font-semibold text-slate-900">{form.title}</h3>}
            {form?.description && <p className="text-sm text-slate-600">{form.description}</p>}
            {(form?.fields || []).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`access-${f.key}`}>{f.label}{f.required ? ' *' : ''}</Label>
                {renderField(f)}
                {f.help && <p className="text-xs text-slate-500">{f.help}</p>}
              </div>
            ))}
            {siteKey && (
              <Turnstile siteKey={siteKey} onSuccess={setTurnstile} onExpire={() => setTurnstile(null)} onError={() => setTurnstile(null)} />
            )}
            <Button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar solicitud'}</Button>
          </form>
        )
      )}

      {mode === 'verify' && (
        !verificationId ? (
          <form onSubmit={onRequestCode} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="access-verify-rut">RUT</Label>
              <Input id="access-verify-rut" name="rut" type="text" autoComplete="off" placeholder="12.345.678-9"
                value={rut} onChange={(e) => setRut(formatRUT(e.target.value))} required />
            </div>
            <Button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar código a mi correo'}</Button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="space-y-3">
            <p className="text-sm text-slate-700">Ingresa el código de 6 dígitos enviado a {maskedEmail}.</p>
            <div className="space-y-1">
              <Label htmlFor="access-code">Código</Label>
              <Input id="access-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code"
                pattern="[0-9]{6}" maxLength={6} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || code.length !== 6}>
                <ShieldCheck className="mr-1 h-4 w-4" aria-hidden />{busy ? 'Verificando…' : 'Confirmar'}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => onRequestCode()}>Reenviar</Button>
            </div>
          </form>
        )
      )}
    </section>
  );
};
