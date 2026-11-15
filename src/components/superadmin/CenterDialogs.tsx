"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth0 } from '@auth0/auth0-react';
import { apiError, CenterStatus, CommissionSimulation, SuperadminCenter, sa } from '@/api/superadminApi';
import { Field, fieldCls, formatCLP, useDebounced } from './ui';

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

export const PrivateDialog: React.FC<{
  center: SuperadminCenter | null;
  onClose: () => void;
  onConfirm: (v: { is_private: boolean; reason: string }) => Promise<void>;
}> = ({ center, onClose, onConfirm }) => {
  const [priv, setPriv] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!center) return;
    setPriv(!!center.is_private);
    setReason('');
  }, [center]);

  const needsReason = priv && !center?.is_private;
  const invalid = needsReason && reason.trim().length < 5;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    setBusy(true);
    try {
      await onConfirm({ is_private: priv, reason: reason.trim() });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!center} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Centro privado</DialogTitle>
            <DialogDescription>{center?.name}</DialogDescription>
          </DialogHeader>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800">
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} className="h-5 w-5 accent-emerald-700" />
            Exigir acceso aprobado para reservar
          </label>
          <Field label={needsReason ? 'Motivo (obligatorio)' : 'Motivo (opcional)'} htmlFor="priv-reason">
            <textarea id="priv-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls} />
          </Field>
          <DialogFooter>
            <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold">Cancelar</button>
            <button type="submit" disabled={busy || invalid} className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">Guardar</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CommissionSimulatorDialog: React.FC<{
  open: boolean;
  centerId: string;
  initialRate: number;
  onClose: () => void;
}> = ({ open, centerId, initialRate, onClose }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [price, setPrice] = useState('30000');
  const [rate, setRate] = useState('5');
  const [sim, setSim] = useState<CommissionSimulation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { if (open) setRate(String(initialRate)); }, [open, initialRate]);

  const dPrice = useDebounced(price);
  const dRate = useDebounced(rate);

  useEffect(() => {
    if (!open) return;
    const p = Number(dPrice);
    const r = Number(dRate);
    if (!(p > 0) || !(r >= 0 && r <= 100) || !Number.isInteger(r)) {
      setSim(null);
      setError('Ingresa un precio mayor a 0 y una comisión entera entre 0 y 100.');
      return;
    }
    let active = true;
    sa.simulateCommission(getAccessTokenSilently, centerId, p, r)
      .then((v) => { if (active) { setSim(v); setError(''); } })
      .catch((e) => { if (active) { setSim(null); setError(apiError(e, 'No se pudo simular')); } });
    return () => { active = false; };
  }, [open, dPrice, dRate, centerId, getAccessTokenSilently]);

  const row = (label: string, value: string, strong = false) => (
    <div className={`flex items-center justify-between gap-3 py-1.5 text-sm ${strong ? 'border-t border-slate-200 pt-2.5 font-bold text-slate-900' : 'text-slate-700'}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simular comisión</DialogTitle>
          <DialogDescription>Calcula cuánto paga el cliente, cuánto recibe el centro y cuánto gana ReservaloYA con las reglas reales de cobro.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio de la reserva (CLP)" htmlFor="sim-price">
            <input id="sim-price" type="number" min={1} step={1} value={price} onChange={(e) => setPrice(e.target.value)} className={fieldCls} />
          </Field>
          <Field label="Comisión (%)" htmlFor="sim-rate" hint="Por defecto, la del formulario.">
            <input id="sim-rate" type="number" min={0} max={100} step={1} value={rate} onChange={(e) => setRate(e.target.value)} className={fieldCls} />
          </Field>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {sim && (
          <dl aria-live="polite" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {row('Precio de la reserva', formatCLP(sim.price))}
            {row(`Comisión ReservaloYA (${sim.rate}%)`, `+ ${formatCLP(sim.surcharge)}`)}
            {row('Total que paga el cliente', formatCLP(sim.total), true)}
            {row(`Costo Mercado Pago (${sim.mp_rate.toLocaleString('es-CL', { maximumFractionDigits: 4 })}% sobre el total)`, `− ${formatCLP(sim.mp_cost)}`)}
            {row('Recibe el centro', formatCLP(sim.center_receives), true)}
            {row('Ganancia neta ReservaloYA', formatCLP(sim.platform_net), true)}
          </dl>
        )}
        {sim?.below_mp_cost && (
          <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Esta comisión no cubre el costo de Mercado Pago: el centro recibiría menos que su precio. Usa 0% o un valor mayor a {sim.mp_rate.toLocaleString('es-CL', { maximumFractionDigits: 4 })}%.</p>
        )}
        {sim && !sim.billed_in_split && (
          <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">Este centro no está conectado por OAuth: no se suma recargo ni hay split, y la comisión se factura aparte. El desglose es referencial.</p>
        )}
        <DialogFooter>
          <button type="button" onClick={onClose} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500`}>Cerrar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
