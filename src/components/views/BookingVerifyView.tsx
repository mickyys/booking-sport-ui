"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CalendarDays, Check, Copy, CreditCard, MapPin,
  MessageCircle, Navigation, Search, Ticket, User,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/axiosInstance';
import { ShareButton } from '@/components/sport-center/ShareButton';
import { googleMapsDirectionsUrl } from '@/utils/geo';
import { getWhatsappShareUrl } from '@/utils/contact';
import {
  PAYMENT_LABELS, STATUS_STYLES, VerifiedBooking, buildShareText, money, parseBookingResponse,
} from '@/utils/bookingVerify';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary,#10b981)] focus-visible:ring-offset-2';

const STEPS = [
  { n: 1, title: 'Ingresa el código', text: 'Lo encuentras en tu correo o comprobante de pago.' },
  { n: 2, title: 'Valida', text: 'Revisa estado, horario y pago al instante.' },
  { n: 3, title: 'Comparte', text: 'Envía la reserva por WhatsApp a tu equipo.' },
];

export const BookingVerifyView: React.FC<{ code?: string }> = ({ code }) => {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [booking, setBooking] = useState<VerifiedBooking | null>(null);
  const [loading, setLoading] = useState(!!code);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setBooking(null);
    api.get(`/bookings/code/${encodeURIComponent(code)}`)
      .then(({ data }) => { if (!cancelled) setBooking(parseBookingResponse(code, data)); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim().replace(/\s+/g, '');
    if (value) router.push(`/reserva/${encodeURIComponent(value)}`);
  };

  const copyCode = async () => {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el código');
    }
  };

  const shareUrl = typeof window !== 'undefined' && code ? `${window.location.origin}/reserva/${code}` : '';
  const shareText = booking ? buildShareText(booking) : '';
  const status = booking ? STATUS_STYLES[booking.status] ?? STATUS_STYLES.expired : null;
  const showEmpty = !code && !loading;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-24 pt-10 text-white">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary,#10b981)]/20 text-[var(--brand-primary,#10b981)]">
            <Ticket className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Verificar reserva</h1>
          <p className="mt-2 text-base text-slate-300">Ingresa el código para ver el estado, horario y pago.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-2 sm:flex-row" role="search">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={code ? `Código actual: ${code}` : 'Código de reserva'}
                aria-label="Código de reserva"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={`min-h-12 w-full rounded-xl border border-slate-600 bg-white py-3 pl-12 pr-4 font-mono text-base uppercase text-slate-900 placeholder:text-slate-500 ${FOCUS}`}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className={`min-h-12 cursor-pointer rounded-xl bg-[var(--brand-primary,#10b981)] px-6 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
            >
              Validar
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto -mt-16 max-w-xl space-y-5 px-4 pb-16" aria-live="polite">
        {showEmpty && (
          <ol className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            {STEPS.map((s) => (
              <li key={s.n} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{s.n}</span>
                <div>
                  <p className="font-semibold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {loading && (
          <div className="animate-pulse space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" role="status" aria-label="Cargando reserva">
            <div className="h-14 rounded-xl bg-slate-200" />
            <div className="h-20 rounded-xl bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        )}

        {notFound && (
          <div role="alert" className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-red-200">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">No encontramos esta reserva</h2>
            <p className="mt-1 text-sm text-slate-600">
              Revisa que el código <span className="font-mono font-semibold">{code}</span> esté bien escrito e inténtalo de nuevo.
            </p>
          </div>
        )}

        {booking && status && (
          <article className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <div className={`flex items-center gap-4 border-b p-5 ${status.className}`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70">
                <status.Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-tight">{status.label}</p>
                <p className="truncate font-mono text-sm">Código {booking.code}</p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copiar código"
                className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/70 transition-colors hover:bg-white ${FOCUS}`}
              >
                {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>

            <div className="bg-slate-50 p-5">
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {booking.spaceName}
              </p>
              {booking.schedule.map((line) => (
                <p key={line} className="text-lg font-bold capitalize leading-snug text-slate-900">{line}</p>
              ))}
            </div>

            <div className="relative" aria-hidden="true">
              <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-slate-100 ring-1 ring-slate-200" />
              <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-slate-100 ring-1 ring-slate-200" />
              <div className="mx-5 border-t-2 border-dashed border-slate-200" />
            </div>

            <dl className="space-y-4 p-5 text-sm">
              <Row icon={MapPin} label="Centro deportivo">
                {booking.centerSlug ? (
                  <Link href={`/${booking.centerSlug}`} className="underline-offset-2 hover:underline">{booking.centerName}</Link>
                ) : booking.centerName}
                {booking.address && <span className="block font-normal text-slate-600">{booking.address}</span>}
              </Row>
              {booking.customerName && <Row icon={User} label="A nombre de">{booking.customerName}</Row>}
              <Row icon={CreditCard} label={PAYMENT_LABELS[booking.paymentMethod] ?? 'Pago online'}>
                <span className="mt-1 grid grid-cols-3 gap-2">
                  <Amount label="Total" value={money(booking.total)} />
                  <Amount label="Pagado" value={money(booking.paid)} tone="text-emerald-700" />
                  <Amount label="Pendiente" value={money(booking.pending)} tone={booking.pending > 0 ? 'text-amber-700' : 'text-slate-500'} />
                </span>
              </Row>
            </dl>

            <div className="space-y-2 border-t border-slate-100 p-5">
              <a
                href={getWhatsappShareUrl(`${shareText}\n${shareUrl}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-4 text-base font-bold text-white no-underline transition-opacity hover:opacity-90 ${FOCUS}`}
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Enviar por WhatsApp
              </a>
              <div className="grid gap-2 sm:grid-cols-2">
                <ShareButton kind="page" title={`Reserva en ${booking.centerName}`} text={shareText} url={shareUrl} label="Compartir reserva" />
                <a
                  href={googleMapsDirectionsUrl({ name: booking.centerName, address: booking.address })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50 ${FOCUS}`}
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Cómo llegar
                </a>
              </div>
              {booking.canCancel && (
                <Link
                  href={`/booking/cancel?code=${encodeURIComponent(booking.code)}`}
                  className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-red-700 underline-offset-2 hover:underline ${FOCUS}`}
                >
                  Cancelar reserva
                </Link>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

const Amount: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone = 'text-slate-900' }) => (
  <span className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
    <span className="block text-xs font-normal text-slate-500">{label}</span>
    <span className={`block font-bold ${tone}`}>{value}</span>
  </span>
);

const Row: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children}</dd>
    </div>
  </div>
);
