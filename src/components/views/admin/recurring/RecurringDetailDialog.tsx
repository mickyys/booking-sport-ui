"use client";

import React from 'react';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Phone,
  Repeat,
  Trash2,
  Trophy,
} from 'lucide-react';
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
  RecurringItem,
  formatCLP,
  formatHour,
  formatLongDate,
  formatRange,
  formatRelativeDay,
  formatShortDate,
  getInitials,
  getKindLabel,
  getTelUrl,
  getUpcomingDates,
  getWhatsappUrl,
} from './recurringUtils';

interface RecurringDetailDialogProps {
  item: RecurringItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (item: RecurringItem) => void;
}

const InfoCell: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className = '',
}) => (
  <div className={`min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3 ${className}`}>
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 truncate text-sm font-bold text-slate-800">{children}</p>
  </div>
);

const ContactAction: React.FC<{
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ icon: Icon, label, href, onClick, disabled }) => {
  const className =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:pointer-events-none disabled:opacity-40';

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={className}
      >
        <Icon size={15} className="text-slate-500" />
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon size={15} className="text-slate-500" />
      {label}
    </button>
  );
};

export const RecurringDetailDialog: React.FC<RecurringDetailDialogProps> = ({
  item,
  open,
  onOpenChange,
  onFinish,
}) => {
  const handleCopy = async () => {
    if (!item?.customerPhone) return;
    try {
      await navigator.clipboard.writeText(item.customerPhone);
      toast.success('Teléfono copiado');
    } catch (error) {
      console.error('Error copying phone:', error);
      toast.error('No se pudo copiar el teléfono');
    }
  };

  const upcoming = item ? getUpcomingDates(item, 3) : [];
  const typeLabel = item?.kind === 'weekly' ? 'Reserva fija semanal' : 'Serie de reservas';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="recurring-detail"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[92dvh] max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        {item && (
          <>
            <DialogHeader className="pr-9">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                    item.isFinished
                      ? 'bg-slate-100 text-slate-500'
                      : item.kind === 'weekly'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                  aria-hidden="true"
                >
                  {getInitials(item.customerName)}
                </span>
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-lg font-black tracking-tight text-slate-900">
                    {item.customerName}
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                    {item.kind === 'weekly' ? <Repeat size={12} /> : <CalendarRange size={12} />}
                    {typeLabel} · {item.courtName}
                  </DialogDescription>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                      item.isFinished
                        ? 'bg-slate-100 text-slate-500'
                        : item.kind === 'weekly'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.isFinished ? <CheckCircle2 size={10} /> : item.kind === 'weekly' ? <Repeat size={10} /> : <CalendarRange size={10} />}
                    {getKindLabel(item)}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="flex gap-2">
              <ContactAction
                icon={Phone}
                label="Llamar"
                href={getTelUrl(item.customerPhone) || undefined}
                disabled={!item.customerPhone}
              />
              <ContactAction
                icon={MessageCircle}
                label="WhatsApp"
                href={getWhatsappUrl(item.customerPhone) || undefined}
                disabled={!item.customerPhone}
              />
              <ContactAction
                icon={Copy}
                label="Copiar"
                onClick={handleCopy}
                disabled={!item.customerPhone}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <InfoCell label="Día">
                <span className="flex items-center gap-1">
                  <CalendarDays size={13} className="text-slate-400" />
                  {item.dayLabel}
                </span>
              </InfoCell>
              <InfoCell label="Hora">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  {formatHour(item.hour, item.minutes)}
                </span>
              </InfoCell>
              <InfoCell label="Cancha">
                <span className="flex items-center gap-1">
                  <Trophy size={13} className="text-slate-400" />
                  {item.courtName}
                </span>
              </InfoCell>
              <InfoCell label={item.isFinished ? 'Finalizada' : 'Próxima reserva'}>
                {item.isFinished
                  ? formatShortDate(item.finishedAt)
                  : item.nextDate
                    ? formatRelativeDay(item.nextDate)
                    : '—'}
              </InfoCell>
            </div>

            {item.kind === 'series' && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Avance de la serie
                  </p>
                  <p className="text-xs font-black text-emerald-700">
                    {item.confirmedBookings} / {item.totalBookings} confirmadas
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-emerald-700/80">
                  {formatRange(item)}
                </p>
              </div>
            )}

            {item.kind === 'weekly' && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  Recurrencia semanal
                </p>
                <p className="mt-1 text-[11px] font-semibold text-amber-700/80">
                  {formatRange(item)}
                </p>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Próximas fechas
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {upcoming.map((date) => (
                    <span
                      key={date.toISOString()}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600"
                    >
                      {formatRelativeDay(date)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.kind === 'weekly' && item.notes && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notas</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{item.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Precio por reserva
                </p>
                <p className="mt-0.5 text-2xl font-black text-emerald-600">{formatCLP(item.price)}</p>
              </div>
              {!item.isFinished && item.kind === 'series' && (
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Total serie
                  </p>
                  <p className="mt-0.5 text-sm font-black text-slate-700">
                    {formatCLP(item.price * item.totalBookings)}
                  </p>
                </div>
              )}
            </div>

            {item.createdAt && (
              <p className="text-center text-[11px] font-medium text-slate-400">
                Creada el {formatLongDate(item.createdAt)}
              </p>
            )}

            <DialogFooter className="mt-1 flex-row gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cerrar
              </button>
              {!item.isFinished && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onFinish(item);
                  }}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 text-sm font-black text-white transition-colors hover:bg-red-600"
                >
                  <Trash2 size={15} />
                  Finalizar
                </button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
