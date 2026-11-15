"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AccessRequest, AccessStatus, createManualAccess, getAccessForm, getAccessStats,
  listAccessRequests, saveAccessForm, setAccessStatus,
} from '@/api/accessApi';
import type { AccessField, AccessForm } from '@/types';
import { formatRUT } from '@/utils/rut';

const STATUS_LABEL: Record<AccessStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', revoked: 'Revocada',
};
const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'revoked', label: 'Revocadas' },
];

export const AdminAccess: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessForm(getAccessTokenSilently).then((r) => setIsPrivate(r.is_private)).catch(() => setIsPrivate(false));
  }, [getAccessTokenSilently]);

  if (isPrivate === null) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Solicitudes de acceso</h1>
      {!isPrivate && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Tu centro es público. La plataforma debe marcarlo como privado para exigir acceso aprobado al reservar.
        </p>
      )}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Solicitudes</TabsTrigger>
          <TabsTrigger value="form">Formulario</TabsTrigger>
        </TabsList>
        <TabsContent value="requests"><RequestsTab /></TabsContent>
        <TabsContent value="form"><FormTab /></TabsContent>
      </Tabs>
    </div>
  );
};

const RequestsTab: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AccessRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<AccessRequest | null>(null);
  const [decision, setDecision] = useState<{ req: AccessRequest; status: AccessStatus } | null>(null);
  const [reason, setReason] = useState('');
  const [manual, setManual] = useState(false);
  const [mRut, setMRut] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mName, setMName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        listAccessRequests(getAccessTokenSilently, { status: status || undefined, q: q || undefined, limit: 50 }),
        getAccessStats(getAccessTokenSilently),
      ]);
      setItems(list.items);
      setCounts(stats);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, status, q]);

  useEffect(() => { load(); }, [load]);

  const needsReason = (s: AccessStatus) => s === 'rejected' || s === 'revoked';

  const apply = async (req: AccessRequest, next: AccessStatus, why?: string) => {
    setBusy(true);
    try {
      await setAccessStatus(getAccessTokenSilently, req.id, next, why);
      toast.success(next === 'approved' ? 'Solicitud aprobada; se envió el correo' : 'Solicitud actualizada');
      setDecision(null);
      setReason('');
      setDetail(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const start = (req: AccessRequest, next: AccessStatus) => {
    if (needsReason(next)) { setDecision({ req, status: next }); setReason(''); } else { apply(req, next); }
  };

  const createManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createManualAccess(getAccessTokenSilently, { rut: mRut, email: mEmail, name: mName });
      toast.success('Persona registrada y aprobada');
      setManual(false); setMRut(''); setMEmail(''); setMName('');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button key={f.value} size="sm" variant={status === f.value ? 'default' : 'outline'} onClick={() => setStatus(f.value)}>
            {f.label}{f.value && counts[f.value] != null ? ` (${counts[f.value]})` : ''}
          </Button>
        ))}
        <Input className="max-w-xs" placeholder="Buscar RUT, correo o nombre" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button size="sm" className="ml-auto" onClick={() => setManual(true)}><Plus className="mr-1 h-4 w-4" />Pre-registrar</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow><TableHead>RUT</TableHead><TableHead>Correo</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={4}><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>}
          {!loading && items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-500">Sin solicitudes</TableCell></TableRow>}
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell><button className="underline" onClick={() => setDetail(r)}>{r.rut}</button></TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell><Badge variant="outline">{STATUS_LABEL[r.status]}</Badge></TableCell>
              <TableCell className="space-x-1 text-right">
                {(r.status === 'pending' || r.status === 'rejected' || r.status === 'revoked') && (
                  <Button size="sm" onClick={() => start(r, 'approved')}>Aprobar</Button>
                )}
                {(r.status === 'pending' || r.status === 'approved') && (
                  <Button size="sm" variant="outline" onClick={() => start(r, 'rejected')}>Rechazar</Button>
                )}
                {r.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => start(r, 'revoked')}>Revocar</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{detail?.name || detail?.rut}</DialogTitle><DialogDescription>{detail && STATUS_LABEL[detail.status]}</DialogDescription></DialogHeader>
          <dl className="space-y-2 text-sm">
            {(detail?.answers || []).map((a) => (
              <div key={a.key}><dt className="font-semibold text-slate-700">{a.label}</dt><dd className="text-slate-600">{a.value || '—'}</dd></div>
            ))}
            {detail?.reason && <div><dt className="font-semibold">Motivo</dt><dd>{detail.reason}</dd></div>}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision?.status === 'revoked' ? 'Revocar acceso' : 'Rechazar solicitud'}</DialogTitle>
            <DialogDescription>El motivo es obligatorio{decision?.status === 'rejected' ? ' y se enviará al solicitante' : ''}.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancelar</Button>
            <Button disabled={busy || reason.trim().length < 5} onClick={() => decision && apply(decision.req, decision.status, reason)}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manual} onOpenChange={setManual}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pre-registrar persona aprobada</DialogTitle><DialogDescription>Se aprueba de inmediato y recibirá un correo.</DialogDescription></DialogHeader>
          <form onSubmit={createManual} className="space-y-3">
            <div><Label htmlFor="m-rut">RUT</Label><Input id="m-rut" value={mRut} onChange={(e) => setMRut(formatRUT(e.target.value))} required /></div>
            <div><Label htmlFor="m-email">Correo</Label><Input id="m-email" name="email" type="email" inputMode="email" autoComplete="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} required /></div>
            <div><Label htmlFor="m-name">Nombre</Label><Input id="m-name" name="name" autoComplete="name" value={mName} onChange={(e) => setMName(e.target.value)} /></div>
            <DialogFooter><Button type="submit" disabled={busy}>Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FormTab: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [form, setForm] = useState<AccessForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccessForm(getAccessTokenSilently).then((r) => setForm(r.form)).catch((e) => toast.error(e.message));
  }, [getAccessTokenSilently]);

  if (!form) return <Loader2 className="animate-spin" />;

  const system = form.fields.filter((f) => f.locked);
  const custom = form.fields.filter((f) => !f.locked);
  const setCustom = (next: AccessField[]) => setForm({ ...form, fields: [...system, ...next] });
  const patch = (i: number, p: Partial<AccessField>) => setCustom(custom.map((f, idx) => (idx === i ? { ...f, ...p } : f)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= custom.length) return;
    const next = [...custom];
    [next[i], next[j]] = [next[j], next[i]];
    setCustom(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveAccessForm(getAccessTokenSilently, form);
      setForm(saved);
      toast.success('Formulario guardado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch id="form-enabled" checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
        <Label htmlFor="form-enabled">Recibir solicitudes desde la página pública</Label>
      </div>
      <div><Label htmlFor="f-title">Título</Label><Input id="f-title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label htmlFor="f-desc">Descripción</Label><Textarea id="f-desc" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

      <div className="space-y-2">
        {system.map((f) => (
          <div key={f.key} className="rounded-lg border bg-slate-50 p-3 text-sm">
            <strong>{f.label}</strong> <span className="text-slate-500">· campo del sistema, obligatorio</span>
          </div>
        ))}
        {custom.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input className="min-w-40 flex-1" placeholder="Etiqueta" value={f.label} onChange={(e) => patch(i, { label: e.target.value })} />
              <select className="h-10 rounded-md border px-2 text-sm" value={f.type} onChange={(e) => patch(i, { type: e.target.value as AccessField['type'] })}>
                <option value="text">Texto</option>
                <option value="textarea">Texto largo</option>
                <option value="select">Lista</option>
                <option value="number">Número</option>
              </select>
              <label className="flex items-center gap-1 text-sm"><Switch checked={f.required} onCheckedChange={(v) => patch(i, { required: v })} />Obligatorio</label>
              <Button size="icon" variant="ghost" aria-label="Subir" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Bajar" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => setCustom(custom.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {f.type === 'select' && (
              <Textarea rows={3} placeholder="Una opción por línea" value={(f.options || []).join('\n')}
                onChange={(e) => patch(i, { options: e.target.value.split('\n') })} />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCustom([...custom, { key: '', label: '', type: 'text', required: false }])}>
          <Plus className="mr-1 h-4 w-4" />Agregar campo
        </Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar formulario'}</Button>
      </div>
    </div>
  );
};
