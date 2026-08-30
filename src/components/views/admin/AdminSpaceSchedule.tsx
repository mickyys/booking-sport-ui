"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import {
  Save, Plus, Trash2, Clock, Calendar, Ban, AlertTriangle, Copy, CalendarOff,
} from 'lucide-react';
import {
  ScheduleRule, ScheduleRuleSlot, ScheduleException, Block,
} from '@/types';
import {
  getSpaceSchedule, saveSpaceSchedule,
  getSpaceExceptions, createSpaceException, deleteSpaceException,
  getSpaceBlocks, createSpaceBlock, deleteSpaceBlock,
} from '@/api/bookingApi';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

type Tab = 'horarios' | 'excepciones' | 'bloqueos';

const emptySlot = (paymentMode?: string): ScheduleRuleSlot => ({
  start_time: '09:00',
  end_time: '10:00',
  price: 0,
  payment_required: paymentMode === 'pay_online',
  payment_optional: false,
  partial_payment_enabled: false,
});

const toDateInput = (iso: string) => (iso || '').slice(0, 10);

// Asegura que cada día pertenezca a una sola regla: si un día está en varias,
// se conserva en la regla más específica (menos días; empate → la primera),
// replicando la prioridad "más específica gana" del backend.
function normalizeRules(rules: ScheduleRule[]): ScheduleRule[] {
  const working = rules.map(r => ({ ...r, days_of_week: [...r.days_of_week] }));
  const spec = rules.map(r => r.days_of_week.length);
  for (let d = 0; d < 7; d++) {
    const owners: number[] = [];
    working.forEach((r, i) => {
      if (r.days_of_week.includes(d)) owners.push(i);
    });
    if (owners.length <= 1) continue;
    owners.sort((a, b) => (spec[a] - spec[b]) || (a - b));
    for (const i of owners.slice(1)) {
      working[i].days_of_week = working[i].days_of_week.filter(x => x !== d);
    }
  }
  return working;
}

function SlotsEditor({ slots, onChange, hidePrice, lockPayment = false, paymentMode }: {
  slots: ScheduleRuleSlot[];
  onChange: (s: ScheduleRuleSlot[]) => void;
  hidePrice?: boolean;
  lockPayment?: boolean;
  paymentMode?: string;
}) {
  const update = (i: number, patch: Partial<ScheduleRuleSlot>) => {
    onChange(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const priceSpan = hidePrice ? 'col-span-0' : 'col-span-3';
  const paySpan = hidePrice ? 'col-span-6' : 'col-span-3';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 items-center px-3">
        <span className="col-span-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Inicio</span>
        <span className="col-span-1" />
        <span className="col-span-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Fin</span>
        {!hidePrice && <span className="col-span-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Precio</span>}
        <span className={`${paySpan} text-[10px] font-black uppercase tracking-wider text-slate-400`}>Pago</span>
        <span className="col-span-1" />
      </div>
      {slots.length === 0 && (
        <p className="text-sm text-slate-400 italic">Sin franjas configuradas</p>
      )}
      {lockPayment && (
        <p className="text-[11px] font-medium text-slate-400 italic flex items-center gap-1 px-3">
          🔒 El pago lo define la modalidad de tu centro (tipo de suscripción) y no es editable por franja.
        </p>
      )}
      {slots.map((s, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          <input
            type="time"
            value={s.start_time}
            onChange={e => update(i, { start_time: e.target.value })}
            className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
          />
          <span className="col-span-1 text-center text-slate-400 text-xs">→</span>
          <input
            type="time"
            value={s.end_time}
            onChange={e => update(i, { end_time: e.target.value })}
            className="col-span-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
          />
          {!hidePrice && (
            <div className="col-span-3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">$</span>
              <input
                type="number"
                min={0}
                value={s.price || ''}
                placeholder="0"
                onChange={e => update(i, { price: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-1 text-sm font-bold text-slate-700"
              />
            </div>
          )}
          <div className={`${paySpan} flex items-center gap-2 text-[10px] font-bold text-slate-500`}>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={!!s.payment_required} disabled={lockPayment}
                onChange={e => update(i, { payment_required: e.target.checked, payment_optional: e.target.checked ? false : s.payment_optional })} />
              Requerido
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={!!s.payment_optional} disabled={lockPayment}
                onChange={e => update(i, { payment_optional: e.target.checked, payment_required: e.target.checked ? false : s.payment_required })} />
              Opcional
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={!!s.partial_payment_enabled} disabled={lockPayment}
                onChange={e => update(i, { partial_payment_enabled: e.target.checked })} />
              Abono
            </label>
          </div>
          <button
            onClick={() => onChange(slots.filter((_, idx) => idx !== i))}
            className="col-span-1 flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...slots, emptySlot(paymentMode)])}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
      >
        <Plus size={14} /> Agregar franja
      </button>
    </div>
  );
}

interface AdminSpaceScheduleProps {
  spaceId: string;
  spaceName?: string;
  category?: string;
  paymentMode?: string;
}

export const AdminSpaceSchedule: React.FC<AdminSpaceScheduleProps> = ({ spaceId, spaceName, category, paymentMode }) => {
  const { getAccessTokenSilently } = useAuth0();

  const isCancha = !category || category === 'cancha';
  const isQuincho = category === 'quincho';
  const isFullDay = category === 'sede' || category === 'piscina';

  // El esquema de pago está determinado por la modalidad comercial del centro.
  const paymentsLocked = paymentMode === 'pay_online' || paymentMode === 'pay_at_center';

  const [tab, setTab] = useState<Tab>('horarios');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Horarios
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [copyPanelFor, setCopyPanelFor] = useState<number | null>(null);

  // Excepciones
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exDraft, setExDraft] = useState<ScheduleException>({ date: '', type: 'closed', slots: [], note: '' });

  // Bloqueos
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDraft, setBlockDraft] = useState<Block>({ date: '', start_time: '09:00', end_time: '10:00', reason: '' });

  const getToken = useCallback(async () => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
      cacheMode: 'off',
    });
  }, [getAccessTokenSilently]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [r, e, b] = await Promise.all([
        getSpaceSchedule(spaceId, token),
        getSpaceExceptions(spaceId, token),
        getSpaceBlocks(spaceId, token),
      ]);
      setRules(r);
      setExceptions(e);
      setBlocks(b);
    } catch (err) {
      console.error('Error loading schedule:', err);
      toast.error('Error al cargar la configuración de horarios');
    } finally {
      setLoading(false);
    }
  }, [getToken, spaceId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const normalized = normalizeRules(rules);
      if (JSON.stringify(normalized.map(r => r.days_of_week)) !== JSON.stringify(rules.map(r => r.days_of_week))) {
        toast.info('Días compartidos entre reglas se asignaron a la regla más específica para evitar solapes');
      }
      const saved = await saveSpaceSchedule(spaceId, normalized, token);
      setRules(saved);
      toast.success('Horarios guardados correctamente');
    } catch (err: any) {
      console.error('Error saving rules:', err);
      toast.error(err?.response?.data?.error || 'Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  const toggleRuleDay = (ruleIdx: number, day: number) => {
    setRules(prev => {
      const target = prev[ruleIdx];
      const has = target.days_of_week.includes(day);
      if (has) {
        return prev.map((r, idx) =>
          idx === ruleIdx ? { ...r, days_of_week: r.days_of_week.filter(d => d !== day) } : r,
        );
      }
      return prev.map((r, idx) => {
        if (idx === ruleIdx) return { ...r, days_of_week: [...r.days_of_week, day] };
        return { ...r, days_of_week: r.days_of_week.filter(d => d !== day) };
      });
    });
  };

  const addRule = () => {
    setRules(prev => [...prev, { days_of_week: [1], slots: [emptySlot(paymentMode)], active: true }]);
  };

  const removeRule = (idx: number) => {
    setRules(prev => prev.filter((_, i) => i !== idx));
    setCopyPanelFor(null);
  };

  const updateRuleSlots = (idx: number, slots: ScheduleRuleSlot[]) => {
    setRules(prev => prev.map((r, i) => (i === idx ? { ...r, slots } : r)));
  };

  const daysCovered = new Set<number>();
  rules.forEach(r => r.days_of_week.forEach(d => daysCovered.add(d)));

  const fullDaySlot: ScheduleRuleSlot = { start_time: '00:00', end_time: '24:00', price: 0, payment_required: false, payment_optional: false, partial_payment_enabled: false };
  const fullDayChecked = rules.length > 0 && rules.every(r => r.slots.length === 1 && r.slots[0].start_time === '00:00' && r.slots[0].end_time === '24:00');
  const toggleFullDay = (on: boolean) => {
    setRules(on
      ? [{ days_of_week: [0, 1, 2, 3, 4, 5, 6], slots: [{ ...fullDaySlot }], active: true }]
      : []);
  };

  const copyRule = (idx: number) => {
    const source = rules[idx];
    const targets = Array.from({ length: 7 }, (_, d) => d).filter(d => !daysCovered.has(d));
    if (targets.length === 0) {
      toast.info('No hay días libres para copiar');
      return;
    }
    const newRules = targets.map(d => ({
      days_of_week: [d],
      slots: source.slots.map(s => ({ ...s })),
      active: true,
    }));
    setRules(prev => [...prev, ...newRules]);
    setCopyPanelFor(null);
    toast.success(`Configuración copiada a ${targets.length} día(s)`);
  };

  const handleCreateException = async () => {
    if (!exDraft.date) {
      toast.error('Selecciona una fecha');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      await createSpaceException(spaceId, exDraft, token);
      toast.success('Excepción creada');
      setShowExceptionForm(false);
      setExDraft({ date: '', type: 'closed', slots: [], note: '' });
      const updated = await getSpaceExceptions(spaceId, token);
      setExceptions(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear excepción');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const token = await getToken();
      await deleteSpaceException(spaceId, id, token);
      const updated = await getSpaceExceptions(spaceId, token);
      setExceptions(updated);
      toast.success('Excepción eliminada');
    } catch (err) {
      toast.error('Error al eliminar excepción');
    }
  };

  const handleCreateBlock = async () => {
    if (!blockDraft.date) {
      toast.error('Selecciona una fecha');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      await createSpaceBlock(spaceId, blockDraft, token);
      toast.success('Bloqueo creado');
      setShowBlockForm(false);
      setBlockDraft({ date: '', start_time: '09:00', end_time: '10:00', reason: '' });
      const updated = await getSpaceBlocks(spaceId, token);
      setBlocks(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear bloqueo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const token = await getToken();
      await deleteSpaceBlock(spaceId, id, token);
      const updated = await getSpaceBlocks(spaceId, token);
      setBlocks(updated);
      toast.success('Bloqueo eliminado');
    } catch (err) {
      toast.error('Error al eliminar bloqueo');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        Cargando configuración de horarios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {spaceName || 'Espacio'}
            <span className="text-slate-400 font-bold text-lg ml-2">· Configuración de horarios</span>
          </h3>
          <p className="text-slate-500 text-sm mt-1">Define franjas semanales, excepciones por fecha y bloqueos puntuales.</p>
        </div>
        {tab === 'horarios' && (
          <button
            onClick={handleSaveRules}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'horarios', label: 'Horarios semanales', icon: <Clock size={15} /> },
          { key: 'excepciones', label: 'Excepciones', icon: <CalendarOff size={15} /> },
          { key: 'bloqueos', label: 'Bloqueos', icon: <Ban size={15} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              tab === t.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== HORARIOS SEMANALES ==================== */}
      {tab === 'horarios' && (
        <div className="space-y-4">
          {isFullDay ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
                <h4 className="font-bold text-slate-900">Disponibilidad — día completo</h4>
                <p className="text-xs text-slate-500">
                  {category === 'sede' ? 'Sede' : 'Piscina'} se arrienda por día completo. Las excepciones y bloqueos se configuran en sus pestañas.
                </p>
              </div>
              <div className="p-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={fullDayChecked} onChange={e => toggleFullDay(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
                  <div>
                    <p className="font-bold text-slate-800">Disponible todos los días</p>
                    <p className="text-sm text-slate-500">Rango 00:00 – 24:00</p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">{isQuincho ? 'Rango de disponibilidad' : 'Reglas semanales'}</h4>
                <p className="text-xs text-slate-500">
                  {isQuincho
                    ? 'Define la franja horaria en que el quincho está disponible (ej. 14:00 – 21:00).'
                    : 'Cada regla aplica a los días seleccionados. La regla más específica gana sobre la general.'}
                </p>
              </div>
              <button onClick={addRule} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">
                <Plus size={15} /> Agregar regla
              </button>
            </div>

            {rules.length === 0 && (
              <div className="p-10 text-center text-slate-400 text-sm">
                No hay reglas configuradas. Crea una regla para definir las franjas de la semana.
              </div>
            )}

            {rules.map((rule, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-b-0 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-2">Días de la semana</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DAY_LABELS.map((label, d) => {
                        const active = rule.days_of_week.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => toggleRuleDay(idx, d)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              active
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setCopyPanelFor(copyPanelFor === idx ? null : idx)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                      title="Copiar franjas a otros días"
                    >
                      <Copy size={14} /> Copiar
                    </button>
                    <button
                      onClick={() => removeRule(idx)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {copyPanelFor === idx && (
                  <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-blue-800">
                      Copiar estas {rule.slots.length} franja(s) a los días sin configuración:
                    </p>
                    <button
                      onClick={() => copyRule(idx)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                    >
                      <Copy size={14} /> Copiar a días libres
                    </button>
                  </div>
                )}

                <SlotsEditor hidePrice={!isCancha} lockPayment={paymentsLocked} paymentMode={paymentMode} slots={rule.slots} onChange={slots => updateRuleSlots(idx, slots)} />
              </div>
            ))}

            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={handleSaveRules}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar horarios'}
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ==================== EXCEPCIONES ==================== */}
      {tab === 'excepciones' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Excepciones por fecha</h4>
              <p className="text-xs text-slate-500">Feriados (cerrado) u horarios especiales para una fecha concreta.</p>
            </div>
            <button
              onClick={() => setShowExceptionForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700"
            >
              <Plus size={15} /> Nueva excepción
            </button>
          </div>

          {showExceptionForm && (
            <div className="p-6 border-b border-slate-100 space-y-4 bg-blue-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fecha</label>
                  <input type="date" value={toDateInput(exDraft.date)} onChange={e => setExDraft({ ...exDraft, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                  <select value={exDraft.type} onChange={e => setExDraft({ ...exDraft, type: e.target.value as any })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="closed">Cerrado</option>
                    <option value="special">Horario especial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nota (opcional)</label>
                  <input value={exDraft.note || ''} onChange={e => setExDraft({ ...exDraft, note: e.target.value })} placeholder="Ej: Feriado 18 sept" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {exDraft.type === 'special' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Franjas del horario especial</label>
                  <SlotsEditor
                    lockPayment={paymentsLocked}
                    paymentMode={paymentMode}
                    slots={exDraft.slots || []}
                    onChange={slots => setExDraft({ ...exDraft, slots })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowExceptionForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancelar</button>
                <button onClick={handleCreateException} disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear excepción'}
                </button>
              </div>
            </div>
          )}

          {exceptions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No hay excepciones. Usa "Nueva excepción" para cerrar un día o aplicar un horario especial.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {exceptions.map(ex => (
                <div key={ex.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    {ex.type === 'closed'
                      ? <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><Ban size={18} /></div>
                      : <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle size={18} /></div>}
                    <div>
                      <p className="font-bold text-slate-800">
                        {toDateInput(ex.date || '')}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${ex.type === 'closed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
                          {ex.type === 'closed' ? 'Cerrado' : 'Horario especial'}
                        </span>
                      </p>
                      {ex.type === 'special' && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(ex.slots || []).map(s => `${s.start_time}–${s.end_time} $${s.price}`).join(' · ')}
                        </p>
                      )}
                      {ex.note && <p className="text-xs text-slate-400 mt-0.5">{ex.note}</p>}
                    </div>
                  </div>
                  {ex.id && (
                    <button onClick={() => handleDeleteException(ex.id!)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== BLOQUEOS ==================== */}
      {tab === 'bloqueos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Bloqueos puntuales</h4>
              <p className="text-xs text-slate-500">Bloquea una franja de un día concreto (ej: mantenimiento) sin tocar la configuración semanal.</p>
            </div>
            <button
              onClick={() => setShowBlockForm(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700"
            >
              <Plus size={15} /> Nuevo bloqueo
            </button>
          </div>

          {showBlockForm && (
            <div className="p-6 border-b border-slate-100 space-y-4 bg-blue-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fecha</label>
                  <input type="date" value={toDateInput(blockDraft.date)} onChange={e => setBlockDraft({ ...blockDraft, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Desde</label>
                  <input type="time" value={blockDraft.start_time} onChange={e => setBlockDraft({ ...blockDraft, start_time: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Hasta</label>
                  <input type="time" value={blockDraft.end_time} onChange={e => setBlockDraft({ ...blockDraft, end_time: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Motivo</label>
                  <input value={blockDraft.reason || ''} onChange={e => setBlockDraft({ ...blockDraft, reason: e.target.value })} placeholder="Ej: Mantenimiento" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowBlockForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Cancelar</button>
                <button onClick={handleCreateBlock} disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear bloqueo'}
                </button>
              </div>
            </div>
          )}

          {blocks.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No hay bloqueos para este espacio.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blocks.map(b => (
                <div key={b.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><Calendar size={18} /></div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {toDateInput(b.date || '')} · {b.start_time} – {b.end_time}
                      </p>
                      {b.reason && <p className="text-xs text-slate-500 mt-0.5">{b.reason}</p>}
                    </div>
                  </div>
                  {b.id && (
                    <button onClick={() => handleDeleteBlock(b.id!)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSpaceSchedule;
