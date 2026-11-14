"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserInviteDialogProps {
  open: boolean;
  submitting: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { email: string; nombre: string }) => void;
}

const inputClass =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40';

export const UserInviteDialog: React.FC<UserInviteDialogProps> = ({
  open,
  submitting,
  error,
  onOpenChange,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (open) {
      setEmail('');
      setNombre('');
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !email.trim()) return;
    onSubmit({ email: email.trim(), nombre: nombre.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent
        data-testid="users-invite"
        className="max-h-[92dvh] overflow-y-auto p-5 sm:max-w-md sm:p-6 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
      >
        <DialogHeader className="pr-9 text-left">
          <DialogTitle className="text-lg font-black text-slate-900">Agregar administrador</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Le enviaremos un correo para que active su cuenta y acceda al panel de este centro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Correo</span>
            <input
              type="email"
              required
              autoFocus
              autoComplete="off"
              placeholder="persona@correo.cl"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">
              Nombre <span className="font-medium text-slate-400">(opcional)</span>
            </span>
            <input
              type="text"
              maxLength={100}
              className={inputClass}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="min-h-11 flex-1 rounded-xl bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? 'Enviando' : 'Invitar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
