"use client";

import React from 'react';
import { Copy, Loader2, Mail, MessageCircle, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatBookingDate,
  formatBookingTime,
  formatCLP,
  formatCreatedAt,
  getCourtName,
  getCustomerName,
  hasPendingBalance,
  paymentLabel,
  statusClass,
  statusLabel,
} from './dashboardUtils';

interface DashboardDetailDialogProps {
  booking: any | null;
  courts: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (booking: any) => void;
  onVerifyPayment?: (booking: any) => Promise<void>;
}

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('56')) return digits;
  if (digits.length === 8 || digits.length === 9) return `56${digits}`;
  return digits;
};

const InfoCell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{children}</p>
  </div>
);

const actionClass =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60';

export const DashboardDetailDialog: React.FC<DashboardDetailDialogProps> = ({
  booking,
  courts,
  open,
  onOpenChange,
  onCancel,
  onVerifyPayment,
}) => {
  const [verifying, setVerifying] = React.useState(false);
  const phone = booking?.customerPhone ? normalizePhone(booking.customerPhone) : '';

  const handleCopy = async () => {
    if (!booking?.booking_code) return;
    try {
      await navigator.clipboard.writeText(booking.booking_code);
      toast.success('Código copiado');
    } catch {
      toast.error('No se pudo copiar el código');
    }
  };

  const handleVerify = async () => {
    if (!onVerifyPayment || !booking) return;
    setVerifying(true);
    try {
      await onVerifyPayment(booking);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="dashboard-detail"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        {booking && (
          <>
            <DialogHeader className="pr-9 text-left">
              <DialogTitle className="truncate text-lg font-black text-slate-900">
                {getCustomerName(booking)}
                {booking.is_guest && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 align-middle text-xs font-bold text-slate-500">
                    Invitado
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(booking.status)}`}
                >
                  {statusLabel(booking.status)}
                </span>
                <span className="font-mono text-xs">{booking.booking_code || 'Sin código'}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2">
              {phone ? (
                <>
                  <a href={`tel:+${phone}`} className={actionClass}>
                    <Phone size={15} className="text-slate-500" />
                    Llamar
                  </a>
                  <a
                    href={`https://wa.me/${phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={actionClass}
                  >
                    <MessageCircle size={15} className="text-slate-500" />
                    WhatsApp
                  </a>
                </>
              ) : null}
              {booking.customerEmail && (
                <a href={`mailto:${booking.customerEmail}`} className={actionClass}>
                  <Mail size={15} className="text-slate-500" />
                  Correo
                </a>
              )}
              {booking.booking_code && (
                <button type="button" onClick={handleCopy} className={actionClass}>
                  <Copy size={15} className="text-slate-500" />
                  Código
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoCell label="Cancha">{getCourtName(booking, courts)}</InfoCell>
              <InfoCell label="Pago">{paymentLabel(booking.payment_method)}</InfoCell>
              <InfoCell label="Fecha">
                <span className="capitalize">{formatBookingDate(booking)}</span>
              </InfoCell>
              <InfoCell label="Hora">{formatBookingTime(booking)}</InfoCell>
            </div>

            {(booking.customerPhone || booking.customerEmail) && (
              <div className="space-y-0.5 text-sm text-slate-600">
                {booking.customerPhone && <p>Tel: {booking.customerPhone}</p>}
                {booking.customerEmail && <p className="truncate">Correo: {booking.customerEmail}</p>}
              </div>
            )}

            {booking.isPartialPayment && (
              <div
                className={`rounded-xl border p-4 ${
                  hasPendingBalance(booking)
                    ? 'border-rose-100 bg-rose-50/70'
                    : 'border-emerald-100 bg-emerald-50/70'
                }`}
              >
                <p className="text-sm font-bold text-slate-800">
                  {hasPendingBalance(booking) ? 'Saldo pendiente' : 'Saldo pagado'}
                </p>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-slate-600">Abono</span>
                  <span className="font-black text-emerald-700">{formatCLP(booking.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pendiente</span>
                  <span
                    className={`font-black ${
                      booking.partialPaymentPaid ? 'text-slate-400 line-through' : 'text-rose-600'
                    }`}
                  >
                    {formatCLP(booking.pendingAmount)}
                  </span>
                </div>
              </div>
            )}

            {formatCreatedAt(booking) && (
              <p className="text-center text-xs font-medium text-slate-500">
                Creada el {formatCreatedAt(booking)}
              </p>
            )}

            <DialogFooter className="mt-1 flex-row gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200"
              >
                Cerrar
              </button>
              {booking.status === 'pending' && booking.payment_method === 'mercadopago' && onVerifyPayment && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {verifying ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Verificar pago en MP
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onCancel(booking);
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 text-sm font-black text-white hover:bg-red-600"
                >
                  <Trash2 size={15} />
                  Cancelar reserva
                </button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
