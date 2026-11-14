"use client";

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RecurringItem } from './recurringUtils';

interface RecurringFinishDialogProps {
  item: RecurringItem | null;
  open: boolean;
  reason: string;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export const RecurringFinishDialog: React.FC<RecurringFinishDialogProps> = ({
  item,
  open,
  reason,
  submitting,
  onOpenChange,
  onReasonChange,
  onConfirm,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-2xl border-slate-200 bg-white">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          ¿Finalizar {item?.kind === 'weekly' ? 'reserva indefinida' : 'serie'}?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-slate-500">
          Se finalizará la recurrencia de <strong className="text-slate-700">{item?.customerName}</strong>.
          El historial se conservará.
          {item?.kind === 'series' &&
            ' Solo se cancelarán las reservas futuras confirmadas o pendientes.'}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-2">
        <label htmlFor="recurring-cancel-reason" className="text-sm font-bold text-slate-700">
          Motivo (opcional)
        </label>
        <textarea
          id="recurring-cancel-reason"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Ej: Cliente solicitó cancelar"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <AlertDialogFooter className="gap-2">
        <AlertDialogCancel
          disabled={submitting}
          className="min-h-11 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
        >
          Mantener
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault();
            onConfirm();
          }}
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 font-bold text-white hover:bg-red-600"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          {submitting ? 'Finalizando...' : 'Finalizar'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
