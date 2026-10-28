"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BadgePercent, Check, Loader2, Mail, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  confirmMemberVerification,
  PriceQuote,
  quoteBooking,
  requestMemberVerification,
} from '@/api/membersApi';

export interface CheckoutBenefits {
  discountCode: string;
  memberToken: string;
  quote: PriceQuote | null;
  quoting?: boolean;
}

interface DiscountPickerProps {
  courtId: string;
  centerId?: string;
  centerSlug?: string;
  date: Date;
  hour: number;
  minutes: number;
  durationMinutes?: number;
  email?: string;
  disabled?: boolean;
  onChange: (benefits: CheckoutBenefits) => void;
}

const money = (value: number) => `$${Math.round(value || 0).toLocaleString('es-CL')}`;

export const DiscountPicker: React.FC<DiscountPickerProps> = ({
  courtId,
  centerId,
  centerSlug,
  date,
  hour,
  minutes,
  durationMinutes,
  email,
  disabled,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [memberToken, setMemberToken] = useState('');
  const [memberName, setMemberName] = useState('');
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const [document, setDocument] = useState('');
  const [memberEmail, setMemberEmail] = useState(email || '');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (email) setMemberEmail((current) => current || email);
  }, [email]);

  const refreshQuote = useCallback(async () => {
    if (!courtId) {
      onChangeRef.current({ discountCode: '', memberToken: '', quote: null, quoting: false });
      return;
    }
    if (!appliedCode && !memberToken) {
      setQuote(null);
      onChangeRef.current({ discountCode: '', memberToken: '', quote: null, quoting: false });
      return;
    }
    setLoading(true);
    try {
      const result = await quoteBooking({
        court_id: courtId,
        date: date.toISOString(),
        hour,
        minutes,
        duration_minutes: durationMinutes,
        discount_code: appliedCode || undefined,
        member_token: memberToken || undefined,
        email: memberEmail || email || undefined,
      });
      setQuote(result);
      onChangeRef.current({ discountCode: appliedCode, memberToken, quote: result, quoting: false });
    } catch (error) {
      setQuote(null);
      onChangeRef.current({ discountCode: appliedCode, memberToken, quote: null, quoting: false });
      toast.error(error instanceof Error ? error.message : 'No pudimos cotizar el descuento');
    } finally {
      setLoading(false);
    }
  }, [courtId, date, hour, minutes, durationMinutes, appliedCode, memberToken, memberEmail, email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshQuote();
    }, 250);
    return () => clearTimeout(timer);
  }, [refreshQuote]);

  const markQuoting = (code: string) => {
    onChangeRef.current({ discountCode: code, memberToken, quote, quoting: true });
  };

  const applyCode = () => {
    const value = codeInput.trim().toUpperCase();
    if (!value) return;
    markQuoting(value);
    setAppliedCode(value);
  };

  const requestCode = async () => {
    if (!document.trim() || !memberEmail.trim()) {
      toast.error('Ingresa tu RUT y el correo de tu membresía');
      return;
    }
    setSending(true);
    try {
      const result = await requestMemberVerification({
        center_id: centerId,
        center_slug: centerId ? undefined : centerSlug,
        document: document.trim(),
        email: memberEmail.trim(),
      });
      setVerificationId(result.verification_id);
      toast.success('Si los datos coinciden, enviamos un código a tu correo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos enviar el código');
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async () => {
    if (!verificationId || !verificationCode.trim()) return;
    setConfirming(true);
    try {
      const result = await confirmMemberVerification({
        verification_id: verificationId,
        code: verificationCode.trim(),
      });
      setMemberToken(result.member_token);
      setMemberName(result.member?.name || 'Socio');
      setVerificationId('');
      setVerificationCode('');
      toast.success(`Beneficio de socio activado${result.member?.plan_name ? `: ${result.member.plan_name}` : ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Código incorrecto');
    } finally {
      setConfirming(false);
    }
  };

  const clearMember = () => {
    setMemberToken('');
    setMemberName('');
  };

  const applied = quote?.applied?.[0];
  const hasBenefit = !!applied;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        disabled={disabled}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <BadgePercent className="h-4 w-4 text-emerald-600" />
          ¿Tienes código o eres socio?
        </span>
        <span className="text-xs font-semibold text-emerald-700">
          {hasBenefit ? `-${money(quote?.discount_total || 0)}` : open ? 'Cerrar' : 'Agregar'}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          {/* Código de descuento */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Ticket className="h-3.5 w-3.5" /> Código de descuento
            </label>
            {appliedCode ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="font-mono text-sm font-semibold text-emerald-800">{appliedCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    markQuoting('');
                    setAppliedCode('');
                    setCodeInput('');
                  }}
                  className="text-emerald-700 hover:text-emerald-900"
                  aria-label="Quitar código"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                  placeholder="Ej: VERANO-ABC123"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={applyCode}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={disabled || !codeInput.trim()}
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {/* Socio */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Mail className="h-3.5 w-3.5" /> Beneficio de socio
            </label>

            {memberToken ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Check className="h-4 w-4" /> {memberName}
                </span>
                <button
                  type="button"
                  onClick={clearMember}
                  className="text-emerald-700 hover:text-emerald-900"
                  aria-label="Quitar beneficio de socio"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : verificationId ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Ingresa el código de 6 dígitos que enviamos a <strong>{memberEmail}</strong>.
                </p>
                <div className="flex gap-2">
                  <input
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-emerald-200"
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    onClick={confirmCode}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    disabled={disabled || confirming || verificationCode.length !== 6}
                  >
                    {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validar'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationId('')}
                  className="text-xs text-slate-500 underline"
                >
                  Usar otro RUT o correo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={document}
                    onChange={(event) => setDocument(event.target.value)}
                    placeholder="RUT"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    disabled={disabled}
                  />
                  <input
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="Correo registrado"
                    type="email"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    disabled={disabled}
                  />
                </div>
                <button
                  type="button"
                  onClick={requestCode}
                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  disabled={disabled || sending}
                >
                  {sending ? 'Enviando código…' : 'Verificar mi membresía'}
                </button>
              </div>
            )}
          </div>

          {/* Resumen de cotización */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculando descuento…
            </div>
          )}
          {!loading && quote && (
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Precio</span>
                <span>{money(quote.base_price)}</span>
              </div>
              {quote.discount_total > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>{applied?.label || 'Descuento'}</span>
                  <span>-{money(quote.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold text-slate-900">
                <span>Total</span>
                <span>{money(quote.final_price)}</span>
              </div>
              {quote.rejected?.length > 0 && (
                <p className="pt-1 text-[11px] leading-snug text-amber-700">
                  {quote.rejected[0].reason}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
