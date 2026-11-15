"use client";

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ClipboardList, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAccessForm, saveAccessForm } from '@/api/accessApi';
import type { AccessField, AccessForm } from '@/types';
import { AccessRequestsTab } from './AccessRequestsTab';

export const AdminAccess: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessForm(getAccessTokenSilently).then((r) => setIsPrivate(r.is_private)).catch(() => setIsPrivate(false));
  }, [getAccessTokenSilently]);

  if (isPrivate === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitudes de acceso</h1>
          <p className="text-sm text-slate-500">
            Revisa, aprueba y administra quién puede reservar en tu centro.
          </p>
        </div>
      </div>
      {!isPrivate && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Tu centro es público. La plataforma debe marcarlo como privado para exigir acceso aprobado al reservar.
        </p>
      )}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="requests" className="rounded-lg">
            <ClipboardList className="h-4 w-4 mr-2" /> Solicitudes
          </TabsTrigger>
          <TabsTrigger value="form" className="rounded-lg">
            <FileText className="h-4 w-4 mr-2" /> Formulario
          </TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="space-y-4"><AccessRequestsTab /></TabsContent>
        <TabsContent value="form" className="space-y-4"><FormTab /></TabsContent>
      </Tabs>
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
