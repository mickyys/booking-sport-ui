"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CenterStatus, SuperadminCenter } from '@/api/superadminApi';
import { Field, fieldCls } from './ui';

const btn = 'h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const copy: Record<CenterStatus, { title: string; desc: string; cta: string; cls: string }> = {
  active: { title: 'Reactivar centro', desc: 'El centro volverá a aparecer en la búsqueda y podrá recibir reservas.', cta: 'Reactivar', cls: 'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-700' },
  suspended: { title: 'Suspender centro', desc: 'El centro se oculta de la búsqueda y no recibe reservas nuevas. Las reservas existentes no se modifican.', cta: 'Suspender', cls: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:outline-amber-600' },
  blocked: { title: 'Bloquear centro', desc: 'El centro se oculta de la búsqueda y no recibe reservas nuevas. Úsalo para incumplimientos graves.', cta: 'Bloquear', cls: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700' },
};

export const StatusDialog: React.FC<{
  center: SuperadminCenter | null;
  target: CenterStatus;
  onClose: () => void;
  onConfirm: (status: CenterStatus, reason: string) => Promise<void>;
}> = ({ center, target, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const needsReason = target !== 'active';
  const c = copy[target];

  useEffect(() => { if (center) setReason(''); }, [center, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await onConfirm(target, reason.trim()); } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!center} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{c.title}</DialogTitle>
            <DialogDescription>{center?.name} — {c.desc}</DialogDescription>
          </DialogHeader>
          {needsReason && (
            <Field label="Motivo (obligatorio)" htmlFor="status-reason" hint="Queda registrado en la auditoría.">
              <textarea id="status-reason" required minLength={5} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={`${fieldCls} h-auto py-2`} />
            </Field>
          )}
          <DialogFooter>
            <button type="button" onClick={onClose} disabled={busy} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500`}>Cancelar</button>
            <button type="submit" disabled={busy || (needsReason && reason.trim().length < 5)} className={`${btn} ${c.cls}`}>{busy ? 'Guardando…' : c.cta}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const toDateInput = (s?: string) => (s ? s.slice(0, 10) : '');

export const FeaturedDialog: React.FC<{
  center: SuperadminCenter | null;
  onClose: () => void;
  onConfirm: (v: { is_featured: boolean; priority: number; until: string | null }) => Promise<void>;
}> = ({ center, onClose, onConfirm }) => {
  const [featured, setFeatured] = useState(false);
  const [priority, setPriority] = useState(0);
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!center) return;
    setFeatured(!!center.is_featured);
    setPriority(center.featured_priority ?? 0);
    setUntil(toDateInput(center.featured_until));
  }, [center]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm({ is_featured: featured, priority, until: until ? new Date(`${until}T23:59:59`).toISOString() : null });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!center} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Centro destacado</DialogTitle>
            <DialogDescription>{center?.name}</DialogDescription>
          </DialogHeader>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-5 w-5 accent-emerald-700" />
            Mostrar como destacado
          </label>
          <Field label="Prioridad (0–1000)" htmlFor="feat-priority" hint="Mayor número aparece primero entre los destacados.">
            <input id="feat-priority" type="number" min={0} max={1000} value={priority} disabled={!featured} onChange={(e) => setPriority(Number(e.target.value))} className={fieldCls} />
          </Field>
          <Field label="Vigente hasta (opcional)" htmlFor="feat-until" hint="Déjalo vacío para que no expire.">
            <input id="feat-until" type="date" value={until} disabled={!featured} onChange={(e) => setUntil(e.target.value)} className={fieldCls} />
          </Field>
          <DialogFooter>
            <button type="button" onClick={onClose} disabled={busy} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500`}>Cancelar</button>
            <button type="submit" disabled={busy} className={`${btn} bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900`}>{busy ? 'Guardando…' : 'Guardar'}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
