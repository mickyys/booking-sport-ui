"use client";

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDown, ArrowUp, ClipboardList, FileText, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Solicitudes de acceso</h1>
        <p className="mt-1 text-sm text-slate-600">
          Revisa, aprueba y administra quién puede reservar en tu centro.
        </p>
      </div>
      {!isPrivate && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>Tu centro es público. La plataforma debe marcarlo como privado para exigir acceso aprobado al reservar.</p>
        </div>
      )}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="h-11 rounded-xl border border-slate-200 bg-white p-1">
          <TabsTrigger value="requests" className="h-9 cursor-pointer rounded-lg px-4 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <ClipboardList className="mr-2 h-4 w-4" aria-hidden="true" /> Solicitudes
          </TabsTrigger>
          <TabsTrigger value="form" className="h-9 cursor-pointer rounded-lg px-4 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" /> Formulario
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
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccessForm(getAccessTokenSilently)
      .then((r) => { setForm(r.form); setSaved(JSON.stringify(r.form)); })
      .catch((e) => toast.error(e.message));
  }, [getAccessTokenSilently]);

  if (!form) return <Loader2 className="animate-spin text-slate-400" />;

  const dirty = JSON.stringify(form) !== saved;
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
      const result = await saveAccessForm(getAccessTokenSilently, form);
      setForm(result);
      setSaved(JSON.stringify(result));
      toast.success('Formulario guardado');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';

  return (
    <div className="space-y-4">
      <section className={`${card} flex items-start gap-3`}>
        <Switch id="form-enabled" checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} className="mt-0.5 data-[state=checked]:bg-emerald-600" />
        <div>
          <Label htmlFor="form-enabled" className="text-sm font-semibold text-slate-900">Recibir solicitudes desde la página pública</Label>
          <p className="text-sm text-slate-500">Si lo desactivas, nadie nuevo podrá pedir acceso por el formulario.</p>
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className="text-base font-semibold text-slate-900">Encabezado del formulario</h2>
        <div className="space-y-1.5"><Label htmlFor="f-title">Título</Label><Input id="f-title" className="h-10" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="f-desc">Descripción</Label><Textarea id="f-desc" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </section>

      <section className={`${card} space-y-3`}>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Campos</h2>
          <p className="text-sm text-slate-500">Los campos del sistema siempre se piden. Agrega los que necesites.</p>
        </div>
        {system.map((f) => (
          <div key={f.key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <strong className="text-slate-800">{f.label}</strong>
            <span className="text-slate-500">· campo del sistema, obligatorio</span>
          </div>
        ))}
        {custom.map((f, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input className="h-10 min-w-40 flex-1" aria-label="Etiqueta del campo" placeholder="Etiqueta" value={f.label} onChange={(e) => patch(i, { label: e.target.value })} />
              <Select value={f.type} onValueChange={(v) => patch(i, { type: v as AccessField['type'] })}>
                <SelectTrigger className="h-10 w-36" aria-label="Tipo de campo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="textarea">Texto largo</SelectItem>
                  <SelectItem value="select">Lista</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
                <Switch checked={f.required} onCheckedChange={(v) => patch(i, { required: v })} className="data-[state=checked]:bg-emerald-600" />Obligatorio
              </label>
              <div className="ml-auto flex">
                <Button size="icon" variant="ghost" className="h-10 w-10" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-10 w-10" aria-label="Bajar" disabled={i === custom.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Eliminar" onClick={() => setCustom(custom.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            {f.type === 'select' && (
              <Textarea rows={3} aria-label="Opciones" placeholder="Una opción por línea" value={(f.options || []).join('\n')}
                onChange={(e) => patch(i, { options: e.target.value.split('\n') })} />
            )}
          </div>
        ))}
        <Button variant="outline" className="h-10 w-full border-dashed" onClick={() => setCustom([...custom, { key: '', label: '', type: 'text', required: false }])}>
          <Plus className="mr-1 h-4 w-4" />Agregar campo
        </Button>
      </section>

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className={`px-1 text-sm ${dirty ? 'font-medium text-amber-700' : 'text-slate-500'}`} aria-live="polite">
          {dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}
        </p>
        <Button onClick={save} disabled={saving || !dirty} className="h-10 bg-emerald-600 text-white hover:bg-emerald-700">
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{saving ? 'Guardando…' : 'Guardar formulario'}
        </Button>
      </div>
    </div>
  );
};
