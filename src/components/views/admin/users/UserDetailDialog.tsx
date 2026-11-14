"use client";

import React from 'react';
import { Loader2, Mail, RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CenterUser, formatLastLogin, getDisplayName } from './usersUtils';

interface UserDetailDialogProps {
  user: CenterUser | null;
  isSelf: boolean;
  isLastAdmin: boolean;
  resending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (user: CenterUser) => void;
  onResend: (user: CenterUser) => void;
}

export const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  user,
  isSelf,
  isLastAdmin,
  resending,
  open,
  onOpenChange,
  onRemove,
  onResend,
}) => {
  const blockedReason = isSelf
    ? 'No puedes quitar tu propio acceso.'
    : isLastAdmin
      ? 'El centro debe tener al menos un administrador.'
      : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="users-detail"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        {user && (
          <>
            <DialogHeader className="pr-9 text-left">
              <DialogTitle className="truncate text-lg font-black text-slate-900">
                {getDisplayName(user)}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Administrador del centro{isSelf ? ' · Tú' : ''}
              </DialogDescription>
            </DialogHeader>

            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Mail size={15} className="text-slate-500" />
                <span className="truncate">{user.email}</span>
              </a>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-xs font-semibold text-slate-500">Último ingreso</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{formatLastLogin(user.last_login)}</p>
            </div>

            {!isSelf && user.email && (
              <button
                type="button"
                disabled={resending}
                onClick={() => onResend(user)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {resending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} className="text-slate-500" />}
                Reenviar invitación
              </button>
            )}

            {blockedReason && <p className="text-sm text-slate-500">{blockedReason}</p>}

            <DialogFooter className="mt-1 flex-row gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={!!blockedReason}
                onClick={() => {
                  onOpenChange(false);
                  onRemove(user);
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 text-sm font-black text-white hover:bg-red-600 disabled:opacity-40"
              >
                <Trash2 size={15} />
                Quitar acceso
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
