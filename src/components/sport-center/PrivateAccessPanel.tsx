"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Hoja inferior en móvil y modal centrado en escritorio, con foco atrapado y cierre con Esc. */
const ModalShell: React.FC<{
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClose, icon, title, description, children }) => (
  <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
    <DialogContent
      className="top-auto bottom-0 flex max-h-[92dvh] w-full max-w-full translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-2xl p-0 sm:top-1/2 sm:bottom-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-emerald-100 bg-emerald-50/60 p-4 pr-14">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <DialogTitle className="text-lg font-bold leading-snug text-slate-900">{title}</DialogTitle>
          {description && <DialogDescription className="mt-0.5 line-clamp-2 text-sm text-slate-600">{description}</DialogDescription>}
        </div>
      </div>
      {children}
    </DialogContent>
  </Dialog>
);

/** Área con scroll invisible; un degradado inferior avisa cuando hay más contenido. */
const ScrollBody: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={ref} onScroll={measure}
        className={`min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
        {children}
      </div>
      <div aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${more ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

const footerCls = 'shrink-0 border-t border-slate-200 bg-white p-4';

const FieldRow: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  valid?: boolean;
  children: React.ReactNode;
}> = ({ id, label, required, error, help, valid, children }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium text-slate-800">
      {label}{required && <span className="text-rose-600" aria-hidden="true"> *</span>}
      {valid && !error && <CheckCircle2 className="ml-1.5 inline h-4 w-4 text-emerald-600" aria-label="Válido" />}
    </Label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-sm text-rose-700">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
      </p>
    ) : help ? (
      <p id={`${id}-help`} className="text-sm text-slate-600">{help}</p>
    ) : null}
  </div>
);

const inputCls = 'h-11 text-base sm:text-sm';
const invalidCls = 'border-rose-400 focus-visible:ring-rose-300';

/** Modal con el formulario de solicitud de acceso ("Registrarse"). */
export const RegisterModal: React.FC<{ center: SportCenter; onClose: () => void }> = ({ center, onClose }) => {
  const form = center.accessForm;
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstile, setTurnstile] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState('');
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  const fields = form?.fields || [];
  const system = fields.filter((f) => f.locked || f.key === 'rut' || f.key === 'email');
  const custom = fields.filter((f) => !system.includes(f));

  const valueOf = (f: AccessField) => (f.key === 'rut' ? rut : f.key === 'email' ? email : answers[f.key] || '');

  const check = (f: AccessField, value: string): string => {
    const v = value.trim();
    if (!v) return f.required ? 'Este campo es obligatorio' : '';
    if (f.key === 'rut' && !validateRUT(v)) return 'RUT inválido. Revisa el número y el dígito verificador';
    if ((f.key === 'email' || f.type === 'email') && !EMAIL_RE.test(v)) return 'Ingresa un correo válido, por ejemplo nombre@correo.cl';
    return '';
  };

  const setError = (key: string, msg: string) => setErrors((e) => {
    const next = { ...e };
    if (msg) next[key] = msg; else delete next[key];
    return next;
  });

  const onBlur = (f: AccessField) => setError(f.key, check(f, valueOf(f)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    fields.forEach((f) => { const m = check(f, valueOf(f)); if (m) found[f.key] = m; });
    setErrors(found);
    const firstKey = fields.find((f) => found[f.key])?.key;
    if (firstKey) {
      document.getElementById(`access-${firstKey}`)?.focus();
      return;
    }
    if (siteKey && !turnstile) {
      setTurnstileError('Completa la verificación de seguridad para continuar');
      return;
    }
    setBusy(true);
    try {
      const extra: Record<string, string> = {};
      fields.forEach((f) => {
        if (f.key !== 'rut' && f.key !== 'email') extra[f.key] = answers[f.key] || '';
      });
      await submitAccessRequest(center.slug, { rut, email, answers: extra, turnstile_token: turnstile || undefined });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderField = (f: AccessField) => {
    const id = `access-${f.key}`;
    const err = errors[f.key];
    const describedBy = err ? `${id}-error` : f.help ? `${id}-help` : undefined;
    const common = {
      id, name: f.key, required: f.required, placeholder: f.placeholder,
      'aria-invalid': !!err, 'aria-describedby': describedBy,
      className: `${inputCls} ${err ? invalidCls : ''}`,
    };
    const set = (v: string) => { setAnswers((a) => ({ ...a, [f.key]: v })); if (errors[f.key]) setError(f.key, ''); };
    let control: React.ReactNode;
    if (f.key === 'rut') {
      control = (
        <Input {...common} type="text" inputMode="text" autoComplete="off" placeholder={f.placeholder || '12.345.678-9'} value={rut}
          onChange={(e) => { setRut(formatRUT(e.target.value)); if (errors.rut) setError('rut', ''); }} onBlur={() => onBlur(f)} />
      );
    } else if (f.key === 'email') {
      control = (
        <Input {...common} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off"
          spellCheck={false} value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setError('email', ''); }} onBlur={() => onBlur(f)} />
      );
    } else if (f.type === 'textarea') {
      control = <Textarea {...common} rows={3} className={`text-base sm:text-sm ${err ? invalidCls : ''}`} value={valueOf(f)} onChange={(e) => set(e.target.value)} onBlur={() => onBlur(f)} />;
    } else if (f.type === 'select') {
      control = (
        <Select value={valueOf(f)} onValueChange={(v) => { set(v); setError(f.key, ''); }}>
          <SelectTrigger id={id} aria-invalid={!!err} aria-describedby={describedBy} className={`h-11 w-full text-base sm:text-sm ${err ? invalidCls : ''}`}>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent className="z-[110]">
            {(f.options || []).filter(Boolean).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    } else if (f.type === 'number') {
      control = <Input {...common} type="number" inputMode="decimal" value={valueOf(f)} onChange={(e) => set(e.target.value)} onBlur={() => onBlur(f)} />;
    } else if (f.type === 'email') {
      control = <Input {...common} type="email" inputMode="email" autoComplete="email" value={valueOf(f)} onChange={(e) => set(e.target.value)} onBlur={() => onBlur(f)} />;
    } else {
      control = <Input {...common} type="text" value={valueOf(f)} onChange={(e) => set(e.target.value)} onBlur={() => onBlur(f)} />;
    }
    const valid = (f.key === 'rut' || f.key === 'email') && !!valueOf(f) && !check(f, valueOf(f));
    return (
      <FieldRow key={f.key} id={id} label={f.label} required={f.required} error={err} help={f.help} valid={valid}>{control}</FieldRow>
    );
  };

  if (submitted) {
    const steps = ['El centro revisa tu solicitud', 'Te avisamos por correo con la respuesta', 'Verificas tu RUT y reservas'];
    return (
      <ModalShell onClose={onClose} icon={<MailCheck className="h-6 w-6" />} title="Solicitud enviada"
        description={<>Enviamos tu solicitud a <strong>{center.name}</strong>. Te avisaremos a <strong className="break-all">{email}</strong>.</>}>
        <div className="space-y-4 p-4">
          <ol className="space-y-3">
            {steps.map((t, i) => (
              <li key={t} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{i + 1}</span>{t}
              </li>
            ))}
          </ol>
          <Button className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={onClose}>Entendido</Button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} icon={<UserPlus className="h-6 w-6" />} title={form?.title || 'Solicitar acceso'}
      description={form?.description || `${center.name} es un centro privado. Completa tus datos y revisaremos tu solicitud.`}>
      <form onSubmit={onSubmit} noValidate autoComplete="on" className="flex min-h-0 flex-1 flex-col">
        <ScrollBody className="space-y-3 p-4">
          <p className="text-xs text-slate-600"><span className="text-rose-600">*</span> Campo obligatorio</p>
          {system.map(renderField)}
          {custom.length > 0 && (
            <fieldset className="space-y-3 border-t border-slate-100 pt-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Información adicional</legend>
              {custom.map(renderField)}
            </fieldset>
          )}
          {siteKey && (
            <div className="min-h-[65px]">
              <Turnstile siteKey={siteKey}
                onSuccess={(t) => { setTurnstile(t); setTurnstileError(''); }}
                onExpire={() => setTurnstile(null)}
                onError={() => { setTurnstile(null); setTurnstileError('No pudimos cargar la verificación. Recarga la página e inténtalo de nuevo'); }} />
              {turnstileError && <p role="alert" className="mt-1 flex items-center gap-1 text-sm text-rose-700"><AlertCircle className="h-4 w-4" aria-hidden="true" />{turnstileError}</p>}
            </div>
          )}
        </ScrollBody>
        <div className={`${footerCls} flex flex-col gap-1 sm:flex-row-reverse sm:gap-2`}>
          <Button type="submit" disabled={busy} className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-1">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full text-slate-600 sm:w-auto" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </ModalShell>
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
  const [rutError, setRutError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const phone = center.contact?.phone || center.phone;
  const contactEmail = center.contact?.email || center.email;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateRUT(rut)) {
      setRutError('RUT inválido. Revisa el número y el dígito verificador');
      document.getElementById('access-verify-rut')?.focus();
      return;
    }
    setBusy(true);
    setNotFound(false);
    setCodeError('');
    try {
      const res = await requestAccessCode(center.slug, rut);
      setVerificationId(res.verification_id);
      setMaskedEmail(res.masked_email);
      setCode('');
      setCooldown(res.resend_in_seconds || 30);
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
    setCodeError('');
    try {
      const res = await confirmAccessCode(center.slug, verificationId, code);
      saveAccessToken(center.id, res.access_token, res.expires_at, res.applicant);
      window.dispatchEvent(new Event('access-changed'));
      toast.success('Acceso verificado');
    } catch (err: any) {
      setCodeError(err.message || 'Código incorrecto o vencido');
    } finally {
      setBusy(false);
    }
  };

  const linkBtn = 'inline-flex h-11 items-center rounded-md border border-amber-300 bg-white px-4 text-sm font-medium text-amber-900 hover:bg-amber-100';

  return (
    <ModalShell onClose={onClose} icon={<ShieldCheck className="h-6 w-6" />} title="Centro privado"
      description={<>Para reservar en {center.name} verifica tu RUT. Te enviaremos un código al correo con el que fuiste aprobado.</>}>
      {!verificationId ? (
        <form onSubmit={sendCode} noValidate className="flex min-h-0 flex-1 flex-col">
          <ScrollBody className="space-y-3 p-4">
          <FieldRow id="access-verify-rut" label="RUT" required error={rutError} help="Con o sin puntos y guion" valid={!rutError && validateRUT(rut)}>
            <Input id="access-verify-rut" name="rut" type="text" autoComplete="off" placeholder="12.345.678-9" required
              aria-invalid={!!rutError} aria-describedby={rutError ? 'access-verify-rut-error' : 'access-verify-rut-help'}
              className={`${inputCls} ${rutError ? invalidCls : ''}`} value={rut}
              onChange={(e) => { setRut(formatRUT(e.target.value)); setRutError(''); setNotFound(false); }} />
          </FieldRow>
          {notFound && (
            <div role="alert" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />No encontramos un acceso aprobado con ese RUT. Regístrate o contacta al centro deportivo.</p>
              <div className="flex flex-wrap gap-2">
                {onRegister && center.accessForm?.enabled && (
                  <Button type="button" className="h-11 bg-emerald-600 text-white hover:bg-emerald-700" onClick={onRegister}>Registrarse</Button>
                )}
                {phone && <a href={`tel:${phone}`} className={linkBtn}>Llamar</a>}
                {contactEmail && <a href={`mailto:${contactEmail}`} className={linkBtn}>Escribir</a>}
              </div>
            </div>
          )}
          </ScrollBody>
          <div className={`${footerCls} flex flex-col gap-1 sm:flex-row-reverse sm:gap-2`}>
            <Button type="submit" disabled={busy} className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-1">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Enviando…' : 'Enviar código'}
            </Button>
            <Button type="button" variant="ghost" className="h-11 w-full text-slate-600 sm:w-auto" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={confirm} className="flex min-h-0 flex-1 flex-col">
          <ScrollBody className="p-4">
          <FieldRow id="access-code" label="Código de 6 dígitos" required error={codeError}
            help={`Lo enviamos a ${maskedEmail}. Revisa también la carpeta de spam.`}>
            <Input id="access-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
              pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required aria-invalid={!!codeError}
              aria-describedby={codeError ? 'access-code-error' : 'access-code-help'}
              className={`h-14 text-center font-mono text-2xl tracking-[0.5em] ${codeError ? invalidCls : ''}`} value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setCodeError(''); }} />
          </FieldRow>
          </ScrollBody>
          <div className={`${footerCls} space-y-1`}>
            <Button type="submit" disabled={busy || code.length !== 6} className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />}
              Validar y continuar
            </Button>
            <Button type="button" variant="ghost" className="h-11 w-full text-slate-700" disabled={busy || cooldown > 0} onClick={() => sendCode()}>
              {cooldown > 0 ? `Reenviar código en ${cooldown} s` : 'Reenviar código'}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};
