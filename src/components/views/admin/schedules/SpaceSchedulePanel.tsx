"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Ban,
  Calendar,
  CalendarOff,
  Check,
  Clock3,
  Copy,
  Info,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  Block,
  ScheduleException,
  ScheduleRule,
  ScheduleSource,
  Space,
  SpaceCategory,
} from '@/types';
import {
  createSpaceBlock,
  createSpaceException,
  deleteSpaceBlock,
  deleteSpaceException,
  getSpaceBlocks,
  getSpaceExceptions,
  saveSpaceSchedule,
} from '@/api/bookingApi';
import {
  ScheduleGroup,
  SlotChargeMode,
  allowedChargeModes,
  createGroupId,
  formatCLP,
  freeDays,
  groupsFromRules,
  rulesFromGroups,
  slotForCategory,
  sourceLabel,
  toDateInput,
  validateGroups,
} from '@/utils/schedule';
import { ScheduleGroupCard, ScheduleSlotRow, WeeklyPreview } from './ScheduleGroupEditor';
import { CreateScheduleDialog } from './CreateScheduleDialog';
import { CopyScheduleDialog } from './CopyScheduleDialog';
import { TimeSelect } from './ScheduleInputs';

type Tab = 'horario' | 'excepciones' | 'bloqueos';

const CATEGORY_LABEL: Record<SpaceCategory, string> = {
  cancha: 'Cancha',
  quincho: 'Quincho',
  sede: 'Sede',
  piscina: 'Piscina',
};

export interface SpaceSchedulePanelProps {
  space: Space;
  initialRules: ScheduleRule[];
  initialSource: ScheduleSource;
  allSpaces?: Space[];
  onSaved?: (spaceId: string, rules: ScheduleRule[], source: ScheduleSource) => void;
  onClose?: () => void;
  variant?: 'modal' | 'page';
  paymentMode?: string | null;
  partialPercent?: number;
  partialEnabled?: boolean;
}

export const SpaceSchedulePanel: React.FC<SpaceSchedulePanelProps> = ({
  space,
  initialRules,
  initialSource,
  allSpaces = [],
  onSaved,
  onClose,
  variant = 'modal',
  paymentMode = '',
  partialPercent = 50,
  partialEnabled = false,
}) => {
  const { getAccessTokenSilently } = useAuth0();
  const category = (space.category || 'cancha') as SpaceCategory;
  const isCancha = category === 'cancha';
  const isModal = variant === 'modal';
  const allowedModes = allowedChargeModes(paymentMode);
  const defaultChargeMode: SlotChargeMode = paymentMode === 'pay_online' ? 'full' : 'none';
  const paymentHint = paymentMode === 'pay_at_center'
    ? 'Modalidad Solo reservas: el cobro online está desactivado.'
    : paymentMode === 'pay_online'
      ? 'Modalidad pago online: toda franja exige pago; elige completo o abono.'
      : undefined;

  const [initialState] = useState(() => {
    const nextGroups = groupsFromRules(initialRules, category);
    return { groups: nextGroups, snapshot: JSON.stringify(nextGroups) };
  });
  const [tab, setTab] = useState<Tab>('horario');
  const [groups, setGroups] = useState<ScheduleGroup[]>(initialState.groups);
  const [baselineGroups, setBaselineGroups] = useState<ScheduleGroup[]>(initialState.groups);
  const [baselineSnapshot, setBaselineSnapshot] = useState(initialState.snapshot);
  const [source, setSource] = useState<ScheduleSource>(initialSource);
  const [baselineSource, setBaselineSource] = useState<ScheduleSource>(initialSource);

  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [copying, setCopying] = useState(false);

  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exDraft, setExDraft] = useState<ScheduleException>({ date: '', type: 'closed', slots: [], note: '' });
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDraft, setBlockDraft] = useState<Block>({ date: '', start_time: '09:00', end_time: '10:00', reason: '' });

  const getToken = useCallback(
    () => getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
    }),
    [getAccessTokenSilently],
  );

  const dirty = JSON.stringify(groups) !== baselineSnapshot;
  const rulesEnabled = source === 'rules';
  const hasGroups = groups.length > 0;
  const canSave = source === 'rules' ? dirty : hasGroups || source === 'legacy';

  const copyTargets = useMemo(
    () => allSpaces.filter((item) => item.id !== space.id && item.category === category),
    [allSpaces, space.id, category],
  );
  const canCopy = hasGroups && !dirty && copyTargets.length > 0;

  const loadExtras = useCallback(async () => {
    setExtrasLoading(true);
    try {
      const token = await getToken();
      const [nextExceptions, nextBlocks] = await Promise.all([
        getSpaceExceptions(space.id, token),
        getSpaceBlocks(space.id, token),
      ]);
      setExceptions(nextExceptions);
      setBlocks(nextBlocks);
    } catch (error) {
      console.error('Error loading schedule extras:', error);
      toast.error('No se pudieron cargar excepciones y bloqueos');
    } finally {
      setExtrasLoading(false);
    }
  }, [getToken, space.id]);

  useEffect(() => {
    if (rulesEnabled) loadExtras();
  }, [rulesEnabled, loadExtras]);

  useEffect(() => {
    if (source !== 'rules' && tab !== 'horario') setTab('horario');
  }, [source, tab]);

  // Evita perder cambios al cerrar o recargar la pestaña.
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const rulesForSave = useCallback(
    () => rulesFromGroups(groups).map((rule) => ({
      ...rule,
      slots: rule.slots.map((slot) => (
        category === 'cancha' ? slot : { ...slot, price: 0 }
      )),
    })),
    [groups, category],
  );

  const handleSave = async () => {
    const validation = validateGroups(groups, category);
    if (validation) {
      toast.error(validation);
      return;
    }
    if (groups.length === 0 && !window.confirm('El espacio quedará cerrado toda la semana. ¿Guardar de todas formas?')) {
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const saved = await saveSpaceSchedule(space.id, rulesForSave(), token);
      const nextSource: ScheduleSource = saved.length > 0 ? 'rules' : 'none';
      const nextGroups = groupsFromRules(saved, category);

      setGroups(nextGroups);
      setBaselineGroups(nextGroups);
      setBaselineSnapshot(JSON.stringify(nextGroups));
      setSource(nextSource);
      setBaselineSource(nextSource);
      onSaved?.(space.id, saved, nextSource);
      toast.success('Horario guardado correctamente');
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error?.response?.data?.error || 'Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setGroups(baselineGroups);
    setSource(baselineSource);
    setTab('horario');
  };

  const handleClose = () => {
    if (!onClose) return;
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Cerrar de todas formas?')) return;
    onClose();
  };

  const handleCreateGroup = (group: ScheduleGroup) => {
    setGroups((prev) => [...prev, group]);
    setShowCreate(false);
  };

  const handleChangeGroup = (nextGroup: ScheduleGroup) => {
    setGroups((prev) => prev.map((group) => (group.id === nextGroup.id ? nextGroup : group)));
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  const handleDuplicateGroup = (group: ScheduleGroup) => {
    const targets = freeDays(groups);
    if (targets.length === 0) {
      toast.info('No hay días libres para duplicar este horario.');
      return;
    }
    setGroups((prev) => [
      ...prev,
      {
        id: createGroupId(),
        days: targets,
        slots: group.slots.map((slot) => ({ ...slot })),
      },
    ]);
    toast.success(`Horario duplicado a ${targets.length} día(s)`);
  };

  const handleCopy = async (targetIds: string[]) => {
    if (dirty) {
      toast.error('Guarda los cambios antes de copiar el horario.');
      return;
    }
    const validation = validateGroups(groups, category);
    if (validation) {
      toast.error(validation);
      return;
    }

    setCopying(true);
    try {
      const token = await getToken();
      const payload = rulesForSave();
      const results = await Promise.allSettled(
        targetIds.map((targetId) => saveSpaceSchedule(targetId, payload, token)),
      );

      let success = 0;
      let failed = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          success += 1;
          const nextSource: ScheduleSource = result.value.length > 0 ? 'rules' : 'none';
          onSaved?.(targetIds[index], result.value, nextSource);
        } else {
          failed += 1;
          console.error('Error copying schedule:', result.reason);
        }
      });

      if (success > 0) toast.success(`Horario copiado a ${success} espacio(s)`);
      if (failed > 0) toast.error(`${failed} espacio(s) no se pudieron actualizar`);
      if (failed === 0) setShowCopy(false);
    } catch (error) {
      console.error('Error copying schedule:', error);
      toast.error('Error al copiar el horario');
    } finally {
      setCopying(false);
    }
  };

  const handleCreateException = async () => {
    if (!exDraft.date) {
      toast.error('Selecciona una fecha');
      return;
    }
    if (exDraft.type === 'special' && (!exDraft.slots || exDraft.slots.length === 0)) {
      toast.error('Agrega al menos una franja para el horario especial');
      return;
    }

    setSavingExtra(true);
    try {
      const token = await getToken();
      const payload: ScheduleException = {
        ...exDraft,
        slots: exDraft.type === 'special'
          ? (exDraft.slots || []).map((slot) => (isCancha ? slot : { ...slot, price: 0 }))
          : [],
      };
      const created = await createSpaceException(space.id, payload, token);
      setExceptions((prev) => [...prev, created]);
      setShowExceptionForm(false);
      setExDraft({ date: '', type: 'closed', slots: [], note: '' });
      toast.success('Excepción creada');
    } catch (error: any) {
      console.error('Error creating exception:', error);
      toast.error(error?.response?.data?.error || 'Error al crear la excepción');
    } finally {
      setSavingExtra(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const token = await getToken();
      await deleteSpaceException(space.id, id, token);
      setExceptions((prev) => prev.filter((item) => item.id !== id));
      toast.success('Excepción eliminada');
    } catch (error) {
      console.error('Error deleting exception:', error);
      toast.error('Error al eliminar la excepción');
    }
  };

  const handleCreateBlock = async () => {
    if (!blockDraft.date) {
      toast.error('Selecciona una fecha');
      return;
    }
    const invalid = blockDraft.start_time >= blockDraft.end_time;
    if (invalid) {
      toast.error('La hora de fin debe ser mayor que la de inicio');
      return;
    }

    setSavingExtra(true);
    try {
      const token = await getToken();
      const created = await createSpaceBlock(space.id, blockDraft, token);
      setBlocks((prev) => [...prev, created]);
      setShowBlockForm(false);
      setBlockDraft({ date: '', start_time: '09:00', end_time: '10:00', reason: '' });
      toast.success('Bloqueo creado');
    } catch (error: any) {
      console.error('Error creating block:', error);
      toast.error(error?.response?.data?.error || 'Error al crear el bloqueo');
    } finally {
      setSavingExtra(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const token = await getToken();
      await deleteSpaceBlock(space.id, id, token);
      setBlocks((prev) => prev.filter((item) => item.id !== id));
      toast.success('Bloqueo eliminado');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Error al eliminar el bloqueo');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; disabled: boolean }[] = [
    { key: 'horario', label: 'Horario semanal', icon: <Clock3 size={15} />, disabled: false },
    { key: 'excepciones', label: 'Excepciones', icon: <CalendarOff size={15} />, disabled: !rulesEnabled },
    { key: 'bloqueos', label: 'Bloqueos', icon: <Ban size={15} />, disabled: !rulesEnabled },
  ];

  return (
    <div className={`bg-white border border-slate-200 ${isModal ? 'rounded-t-3xl sm:rounded-3xl' : 'rounded-2xl'}`}>
      <div className={`${isModal ? 'sticky top-0 z-20' : ''} border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Horario y tarifas</p>
            <h2 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{space.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
                {CATEGORY_LABEL[category]}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                source === 'rules'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : source === 'legacy'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                {sourceLabel(source)}
              </span>
              {dirty && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Cambios sin guardar
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="hidden items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-40 sm:inline-flex"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 px-5 sm:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.disabled) {
                  toast.info('Guarda primero el horario semanal para habilitar esta sección.');
                  return;
                }
                setTab(item.key);
              }}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-black transition-colors ${
                tab === item.key
                  ? 'border-emerald-500 text-emerald-700'
                  : item.disabled
                    ? 'cursor-not-allowed border-transparent text-slate-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.disabled ? <Lock size={13} /> : item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {source === 'legacy' && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-900">Este espacio todavía usa el horario anterior</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Revisa los días y las franjas. Al guardar, la configuración se migra al nuevo modelo y se habilitan excepciones y bloqueos.
              </p>
            </div>
          </div>
        )}

        {tab === 'horario' && (
          <div className="space-y-4">
            {hasGroups && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Horario semanal</h3>
                  <p className="text-xs text-slate-500">Cada día pertenece a un solo horario. Los días usados aparecen bloqueados.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCopy(true)}
                    disabled={!canCopy}
                    title={dirty ? 'Guarda los cambios antes de copiar' : copyTargets.length === 0 ? 'No hay otros espacios de esta categoría' : undefined}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Copy size={14} /> Copiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    disabled={freeDays(groups).length === 0}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    <Plus size={14} /> Nuevo horario
                  </button>
                </div>
              </div>
            )}

            {hasGroups ? (
              <div className="space-y-3">
                {groups.map((group) => (
                  <ScheduleGroupCard
                    key={group.id}
                    group={group}
                    category={category}
                    otherGroups={groups.filter((item) => item.id !== group.id)}
                    onChange={handleChangeGroup}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onDuplicate={() => handleDuplicateGroup(group)}
                    allowedModes={allowedModes}
                    partialPercent={partialPercent}
                    inheritedPartial={partialEnabled}
                    paymentHint={paymentHint}
                  />
                ))}
                {freeDays(groups).length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                    Todos los días tienen horario. Para cambiar uno, edita el horario correspondiente o elimínalo.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                <p className="text-sm font-bold text-slate-600">No hay horarios configurados</p>
                <p className="mt-1 text-xs text-slate-400">El espacio aparecerá cerrado hasta que crees un horario.</p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
                >
                  <Plus size={14} /> Crear horario
                </button>
              </div>
            )}

            {isCancha && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500">
                <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <p>
                  {paymentMode === 'pay_at_center'
                    ? 'Modalidad Solo reservas: las franjas no cobran online.'
                    : paymentMode === 'pay_online'
                      ? 'Modalidad pago online: todas las franjas exigen pago; aquí eliges completo o abono.'
                      : 'Define en cada franja si se cobra al reservar y si se permite abono.'}
                  <a href="/admin/settings" className="ml-1 font-bold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900">
                    Revisar modalidad en Pagos
                  </a>
                </p>
              </div>
            )}

            {hasGroups && <WeeklyPreview groups={groups} category={category} />}
          </div>
        )}

        {tab === 'excepciones' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Excepciones por fecha</h3>
                <p className="text-xs text-slate-500">Cierra un feriado o aplica un horario especial a una fecha concreta.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowExceptionForm((value) => !value)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
              >
                <Plus size={14} /> Nueva excepción
              </button>
            </div>

            {showExceptionForm && (
              <div className="space-y-4 border-b border-slate-100 bg-blue-50/30 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Fecha</label>
                    <input
                      type="date"
                      value={toDateInput(exDraft.date)}
                      onChange={(event) => setExDraft({ ...exDraft, date: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Tipo</label>
                    <select
                      value={exDraft.type}
                      onChange={(event) => {
                        const type = event.target.value as ScheduleException['type'];
                        setExDraft({
                          ...exDraft,
                          type,
                          slots: type === 'special' && (!exDraft.slots || exDraft.slots.length === 0)
                            ? [slotForCategory(category, '09:00', '10:00', 0, defaultChargeMode)]
                            : type === 'closed'
                              ? []
                              : exDraft.slots,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="closed">Cerrado</option>
                      <option value="special">Horario especial</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Nota (opcional)</label>
                    <input
                      value={exDraft.note || ''}
                      onChange={(event) => setExDraft({ ...exDraft, note: event.target.value })}
                      placeholder="Ej: Feriado 18 sept"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {exDraft.type === 'special' && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Franjas del horario especial</label>
                    {(exDraft.slots || []).map((slot, index) => (
                      <ScheduleSlotRow
                        key={index}
                        slot={slot}
                        category={category}
                        canRemove={(exDraft.slots || []).length > 1}
                        onChange={(value) => setExDraft({
                          ...exDraft,
                          slots: (exDraft.slots || []).map((item, slotIndex) => (slotIndex === index ? value : item)),
                        })}
                        onRemove={() => setExDraft({
                          ...exDraft,
                          slots: (exDraft.slots || []).filter((_, slotIndex) => slotIndex !== index),
                        })}
                        allowedModes={allowedModes}
                        partialPercent={partialPercent}
                        inheritedPartial={partialEnabled}
                        paymentHint={paymentHint}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setExDraft({
                        ...exDraft,
                        slots: [...(exDraft.slots || []), slotForCategory(category, '09:00', '10:00', 0, defaultChargeMode)],
                      })}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={14} /> Agregar franja
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExceptionForm(false)}
                    className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateException}
                    disabled={savingExtra}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {savingExtra ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Crear excepción
                  </button>
                </div>
              </div>
            )}

            {extrasLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Cargando excepciones...
              </div>
            ) : exceptions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No hay excepciones para este espacio.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {exceptions.map((exception) => (
                  <div key={exception.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        exception.type === 'closed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {exception.type === 'closed' ? <Ban size={17} /> : <AlertTriangle size={17} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {toDateInput(exception.date)}
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                            exception.type === 'closed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {exception.type === 'closed' ? 'Cerrado' : 'Horario especial'}
                          </span>
                        </p>
                        {exception.type === 'special' && (
                          <p className="truncate text-[11px] text-slate-500">
                            {(exception.slots || []).map((slot) => (
                              `${slot.start_time}–${slot.end_time}${isCancha ? ` · ${formatCLP(slot.price)}` : ''}`
                            )).join(' · ')}
                          </p>
                        )}
                        {exception.note && <p className="truncate text-[11px] text-slate-400">{exception.note}</p>}
                      </div>
                    </div>
                    {exception.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteException(exception.id!)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        title="Eliminar excepción"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'bloqueos' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Bloqueos puntuales</h3>
                <p className="text-xs text-slate-500">Bloquea una franja de un día concreto sin tocar el horario semanal.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockForm((value) => !value)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
              >
                <Plus size={14} /> Nuevo bloqueo
              </button>
            </div>

            {showBlockForm && (
              <div className="space-y-4 border-b border-slate-100 bg-blue-50/30 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Fecha</label>
                    <input
                      type="date"
                      value={toDateInput(blockDraft.date)}
                      onChange={(event) => setBlockDraft({ ...blockDraft, date: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Desde</label>
                    <TimeSelect value={blockDraft.start_time} onChange={(value) => setBlockDraft({ ...blockDraft, start_time: value })} className="w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Hasta</label>
                    <TimeSelect value={blockDraft.end_time} onChange={(value) => setBlockDraft({ ...blockDraft, end_time: value })} className="w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Motivo</label>
                    <input
                      value={blockDraft.reason || ''}
                      onChange={(event) => setBlockDraft({ ...blockDraft, reason: event.target.value })}
                      placeholder="Ej: Mantenimiento"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBlockForm(false)}
                    className="min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBlock}
                    disabled={savingExtra}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {savingExtra ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Crear bloqueo
                  </button>
                </div>
              </div>
            )}

            {extrasLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Cargando bloqueos...
              </div>
            ) : blocks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No hay bloqueos para este espacio.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {blocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Calendar size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {toDateInput(block.date)} · {block.start_time}–{block.end_time}
                        </p>
                        {block.reason && <p className="truncate text-[11px] text-slate-500">{block.reason}</p>}
                      </div>
                    </div>
                    {block.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id!)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        title="Eliminar bloqueo"
                      >
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

      <div
        className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold text-slate-400">
            {tab === 'horario'
              ? dirty
                ? 'Hay cambios sin guardar.'
                : source === 'legacy'
                  ? 'Horario anterior pendiente de migrar.'
                  : 'Los cambios se guardan de forma explícita.'
              : dirty
                ? 'Hay cambios sin guardar en el horario semanal.'
                : 'Las excepciones y bloqueos se guardan al crearlos.'}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty && source === baselineSource}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:min-h-0 sm:flex-none sm:py-2"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-black text-white hover:bg-emerald-600 disabled:opacity-40 sm:min-h-0 sm:flex-none sm:py-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>

      <CreateScheduleDialog
        open={showCreate}
        space={space}
        groups={groups}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateGroup}
        paymentMode={paymentMode}
        partialPercent={partialPercent}
      />

      <CopyScheduleDialog
        open={showCopy}
        sourceSpace={space}
        spaces={allSpaces}
        onClose={() => setShowCopy(false)}
        onCopy={handleCopy}
        copying={copying}
      />
    </div>
  );
};

export default SpaceSchedulePanel;
