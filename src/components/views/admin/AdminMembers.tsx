"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import {
  BadgePercent,
  CalendarClock,
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBookingStore } from '@/store/useBookingStore';
import {
  createDiscountBatch,
  createDiscountCode,
  createMember,
  createPlan,
  deleteMember,
  deletePlan,
  DiscountCode,
  DiscountPeriod,
  DiscountScopeMode,
  DiscountType,
  DiscountUsage,
  exportDiscountCodesUrl,
  listDiscountCodes,
  listDiscountUsages,
  listMembers,
  listPlans,
  Member,
  MembershipPlan,
  SpaceCategory,
  updateMember,
  updatePlan,
  voidDiscountBatch,
  voidDiscountCode,
} from '@/api/membersApi';

const CATEGORIES: { value: SpaceCategory; label: string }[] = [
  { value: 'cancha', label: 'Canchas' },
  { value: 'quincho', label: 'Quinchos' },
  { value: 'sede', label: 'Sedes' },
  { value: 'piscina', label: 'Piscinas' },
];

// Los descuentos de socios y códigos se aplican por ahora solo a reservas de
// canchas. Las reservas por día de sedes y piscinas usan otro flujo que aún no
// consume estos beneficios, así que no se ofrecen en el alcance para no
// configurar descuentos que no se aplicarían.
const DISCOUNT_CATEGORIES = CATEGORIES.filter((category) => category.value === 'cancha');

const PERIODS: { value: DiscountPeriod; label: string; phrase: string }[] = [
  { value: 'total', label: 'Sin límite por período (total)', phrase: 'en total' },
  { value: 'day', label: 'Por día', phrase: 'por día' },
  { value: 'week', label: 'Por semana', phrase: 'por semana' },
  { value: 'fortnight', label: 'Por quincena', phrase: 'por quincena' },
  { value: 'month', label: 'Por mes', phrase: 'por mes' },
  { value: 'year', label: 'Por año', phrase: 'por año' },
];

const periodPhrase = (period?: DiscountPeriod) =>
  PERIODS.find((p) => p.value === period)?.phrase || 'en total';

const money = (value: number) =>
  `$${Math.round(value || 0).toLocaleString('es-CL')}`;

const dateLabel = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CL') : '—';

const toISO = (value: string) => (value ? new Date(`${value}T12:00:00`).toISOString() : null);
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

const discountLabel = (type: DiscountType, value: number) =>
  type === 'PERCENT' ? `${value}%` : money(value);

interface ScopeState {
  mode: DiscountScopeMode;
  categories: SpaceCategory[];
  spaceIds: string[];
}

const defaultScope = (): ScopeState => ({ mode: 'category', categories: ['cancha'], spaceIds: [] });

function scopePayload(scope: ScopeState) {
  return {
    mode: scope.mode,
    categories: scope.mode === 'category' ? scope.categories : undefined,
    space_ids: scope.mode === 'spaces' ? scope.spaceIds : undefined,
  };
}

function scopeLabel(scope?: { mode?: DiscountScopeMode; categories?: SpaceCategory[]; space_ids?: string[] }) {
  if (!scope || !scope.mode || scope.mode === 'category') {
    const cats = scope?.categories?.length ? scope.categories : ['cancha'];
    return cats.map((c) => CATEGORIES.find((x) => x.value === c)?.label || c).join(', ');
  }
  if (scope.mode === 'all') return 'Todas las canchas';
  return `${scope.space_ids?.length || 0} espacio(s)`;
}

// --- Editor de alcance compartido ---

const ScopeEditor: React.FC<{
  value: ScopeState;
  onChange: (next: ScopeState) => void;
  spaces: any[];
}> = ({ value, onChange, spaces }) => {
  const toggleCategory = (category: SpaceCategory) => {
    const exists = value.categories.includes(category);
    onChange({
      ...value,
      categories: exists ? value.categories.filter((c) => c !== category) : [...value.categories, category],
    });
  };
  const toggleSpace = (id: string) => {
    const exists = value.spaceIds.includes(id);
    onChange({
      ...value,
      spaceIds: exists ? value.spaceIds.filter((s) => s !== id) : [...value.spaceIds, id],
    });
  };
  const courtSpaces = spaces.filter((space) => !space.category || space.category === 'cancha');

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Alcance</Label>
        <Select value={value.mode} onValueChange={(mode) => onChange({ ...value, mode: mode as DiscountScopeMode })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Categorías de espacio</SelectItem>
            <SelectItem value="spaces">Espacios específicos</SelectItem>
            <SelectItem value="all">Todas las canchas</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Los descuentos se aplican a reservas de canchas. Sedes, piscinas y quinchos todavía no admiten descuentos.
        </p>
      </div>

      {value.mode === 'category' && (
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_CATEGORIES.map((cat) => {
            const active = value.categories.includes(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {value.mode === 'spaces' && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
          {courtSpaces.length === 0 && (
            <p className="p-3 text-xs text-slate-500">No hay canchas disponibles.</p>
          )}
          {courtSpaces.map((space) => (
            <label key={space.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={value.spaceIds.includes(space.id)}
                onChange={() => toggleSpace(space.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="flex-1">{space.name}</span>
              <span className="text-xs text-slate-400 capitalize">{space.category}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Formulario de descuento ---

const DiscountFields: React.FC<{
  type: DiscountType;
  value: number;
  onType: (type: DiscountType) => void;
  onValue: (value: number) => void;
}> = ({ type, value, onType, onValue }) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1.5">
      <Label>Tipo</Label>
      <Select value={type} onValueChange={(v) => onType(v as DiscountType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PERCENT">Porcentaje</SelectItem>
          <SelectItem value="FIXED">Monto fijo</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5">
      <Label>{type === 'PERCENT' ? 'Descuento (%)' : 'Descuento ($)'}</Label>
      <Input
        type="number"
        min={0}
        max={type === 'PERCENT' ? 100 : undefined}
        value={value}
        onChange={(e) => onValue(Number(e.target.value))}
      />
    </div>
  </div>
);

const UsageLimitFields: React.FC<{
  maxUses: number;
  maxUsesPerUser: number;
  period: DiscountPeriod;
  onChange: (next: { maxUses?: number; maxUsesPerUser?: number; period?: DiscountPeriod }) => void;
  /**
   * En los planes de socio el backend solo aplica el límite por persona; el
   * total global no se usa, así que se oculta para no prometer un tope que no
   * existe. En los códigos de descuento sí se muestra.
   */
  showTotalUses?: boolean;
}> = ({ maxUses, maxUsesPerUser, period, onChange, showTotalUses = true }) => {
  const periodDisabled = maxUsesPerUser <= 0;
  const help = periodDisabled
    ? 'Sin límite por persona: el socio puede usar el descuento en cada reserva.'
    : `Máximo ${maxUsesPerUser} ${maxUsesPerUser === 1 ? 'descuento' : 'descuentos'} por socio ${periodPhrase(period)}.`;

  return (
    <div className="grid grid-cols-2 gap-3">
      {showTotalUses && (
        <div className="space-y-1.5">
          <Label>Usos totales (0 = ilimitado)</Label>
          <Input
            type="number"
            min={0}
            value={maxUses}
            onChange={(e) => onChange({ maxUses: Number(e.target.value) })}
          />
        </div>
      )}
      <div className={showTotalUses ? 'space-y-1.5' : 'space-y-1.5 col-span-2'}>
        <Label>Usos por persona (0 = ilimitado)</Label>
        <Input
          type="number"
          min={0}
          value={maxUsesPerUser}
          onChange={(e) => onChange({ maxUsesPerUser: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label>Período del límite por persona</Label>
        <Select
          value={period}
          onValueChange={(v) => onChange({ period: v as DiscountPeriod })}
          disabled={periodDisabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">{help}</p>
      </div>
    </div>
  );
};

// --- Diálogo de planes ---

interface PlanFormState {
  name: string;
  description: string;
  type: DiscountType;
  value: number;
  scope: ScopeState;
  maxUses: number;
  maxUsesPerUser: number;
  period: DiscountPeriod;
  active: boolean;
}

const emptyPlan = (): PlanFormState => ({
  name: '',
  description: '',
  type: 'PERCENT',
  value: 10,
  scope: defaultScope(),
  maxUses: 0,
  maxUsesPerUser: 0,
  period: 'total',
  active: true,
});

const PlanDialog: React.FC<{
  open: boolean;
  plan: MembershipPlan | null;
  spaces: any[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, plan, spaces, onClose, onSaved }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [form, setForm] = useState<PlanFormState>(emptyPlan());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (plan) {
      setForm({
        name: plan.name,
        description: plan.description || '',
        type: plan.discount.type,
        value: plan.discount.value,
        scope: {
          mode: plan.scope?.mode || 'category',
          // El alcance por categoría queda limitado a canchas mientras las
          // reservas por día no consuman descuentos.
          categories: ['cancha'],
          spaceIds: plan.scope?.space_ids || [],
        },
        maxUses: plan.usage_limit?.max_uses || 0,
        maxUsesPerUser: plan.usage_limit?.max_uses_per_user || 0,
        period: plan.usage_limit?.period || 'total',
        active: plan.active,
      });
    } else {
      setForm(emptyPlan());
    }
  }, [open, plan]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre del plan es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        discount: { type: form.type, value: form.value },
        scope: scopePayload(form.scope),
        usage_limit: {
          max_uses: form.maxUses,
          max_uses_per_user: form.maxUsesPerUser,
          period: form.period,
        },
        active: form.active,
      };
      if (plan) {
        await updatePlan(getAccessTokenSilently, plan.id, payload);
      } else {
        await createPlan(getAccessTokenSilently, payload);
      }
      toast.success(plan ? 'Plan actualizado' : 'Plan creado');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar plan' : 'Nuevo plan de socio'}</DialogTitle>
          <DialogDescription>
            El cobro de la membresía se hace fuera de ReservaloYA. Aquí defines el beneficio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Socio Full"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Beneficios de la membresía"
              rows={2}
            />
          </div>
          <DiscountFields
            type={form.type}
            value={form.value}
            onType={(type) => setForm({ ...form, type })}
            onValue={(value) => setForm({ ...form, value })}
          />
          <ScopeEditor value={form.scope} onChange={(scope) => setForm({ ...form, scope })} spaces={spaces} />
          <UsageLimitFields
            maxUses={form.maxUses}
            maxUsesPerUser={form.maxUsesPerUser}
            period={form.period}
            onChange={(next) => setForm({ ...form, ...next })}
            showTotalUses={false}
          />
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Plan activo</p>
              <p className="text-xs text-slate-500">Solo los planes activos aplican descuentos.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Diálogo de socios ---

interface MemberFormState {
  name: string;
  document: string;
  email: string;
  phone: string;
  planId: string;
  status: Member['status'];
  validFrom: string;
  validTo: string;
  notes: string;
}

const emptyMember = (): MemberFormState => ({
  name: '',
  document: '',
  email: '',
  phone: '',
  planId: '',
  status: 'active',
  validFrom: '',
  validTo: '',
  notes: '',
});

const MemberDialog: React.FC<{
  open: boolean;
  member: Member | null;
  plans: MembershipPlan[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, member, plans, onClose, onSaved }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [form, setForm] = useState<MemberFormState>(emptyMember());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setForm({
        name: member.name,
        document: member.document_number,
        email: member.email,
        phone: member.phone || '',
        planId: member.plan_id,
        status: member.status,
        validFrom: toDateInput(member.valid_from),
        validTo: toDateInput(member.valid_to),
        notes: member.notes || '',
      });
    } else {
      setForm({ ...emptyMember(), planId: plans.find((p) => p.active)?.id || '' });
    }
  }, [open, member, plans]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        document_number: form.document.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        plan_id: form.planId,
        status: form.status,
        valid_from: toISO(form.validFrom),
        valid_to: toISO(form.validTo),
        notes: form.notes.trim(),
      };
      if (member) {
        await updateMember(getAccessTokenSilently, member.id, payload);
      } else {
        await createMember(getAccessTokenSilently, payload);
      }
      toast.success(member ? 'Socio actualizado' : 'Socio agregado');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el socio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Editar socio' : 'Nuevo socio'}</DialogTitle>
          <DialogDescription>
            El socio se identifica en el checkout con su RUT y el correo registrado aquí.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>RUT</Label>
              <Input
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                placeholder="12.345.678-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.planId} onValueChange={(planId) => setForm({ ...form, planId })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                      {!plan.active ? ' (inactivo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(status) => setForm({ ...form, status: status as Member['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vigente desde</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vigente hasta</Label>
              <Input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || !form.planId}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Diálogo de generación de códigos ---

interface BatchFormState {
  count: number;
  prefix: string;
  code: string;
  type: DiscountType;
  value: number;
  scope: ScopeState;
  maxUses: number;
  maxUsesPerUser: number;
  period: DiscountPeriod;
  minAmount: number;
  validFrom: string;
  validTo: string;
}

const emptyBatch = (): BatchFormState => ({
  count: 10,
  prefix: '',
  code: '',
  type: 'PERCENT',
  value: 10,
  scope: defaultScope(),
  maxUses: 0,
  maxUsesPerUser: 1,
  period: 'total',
  minAmount: 0,
  validFrom: '',
  validTo: '',
});

const BatchDialog: React.FC<{
  open: boolean;
  spaces: any[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, spaces, onClose, onSaved }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [form, setForm] = useState<BatchFormState>(emptyBatch());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyBatch());
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        discount: { type: form.type, value: form.value },
        scope: scopePayload(form.scope),
        usage_limit: {
          max_uses: form.maxUses,
          max_uses_per_user: form.maxUsesPerUser,
          period: form.period,
        },
        min_amount: form.minAmount,
        valid_from: toISO(form.validFrom),
        valid_to: toISO(form.validTo),
      };
      if (form.count === 1 && form.code.trim()) {
        await createDiscountCode(getAccessTokenSilently, { ...payload, code: form.code.trim() });
        toast.success('Código creado');
      } else {
        const result = await createDiscountBatch(getAccessTokenSilently, {
          ...payload,
          count: form.count,
          prefix: form.prefix.trim(),
        });
        toast.success(`${result.count} códigos generados`);
      }
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron generar los códigos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar códigos de descuento</DialogTitle>
          <DialogDescription>
            Los códigos son únicos por centro y puedes anularlos cuando quieras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={form.count}
                onChange={(e) => setForm({ ...form, count: Math.max(1, Number(e.target.value)) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prefijo (opcional)</Label>
              <Input
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                placeholder="VERANO"
                disabled={form.count === 1 && !!form.code.trim()}
              />
            </div>
          </div>
          {form.count === 1 && (
            <div className="space-y-1.5">
              <Label>Código personalizado (opcional)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Se genera automáticamente si lo dejas vacío"
              />
            </div>
          )}
          <DiscountFields
            type={form.type}
            value={form.value}
            onType={(type) => setForm({ ...form, type })}
            onValue={(value) => setForm({ ...form, value })}
          />
          <ScopeEditor value={form.scope} onChange={(scope) => setForm({ ...form, scope })} spaces={spaces} />
          <UsageLimitFields
            maxUses={form.maxUses}
            maxUsesPerUser={form.maxUsesPerUser}
            period={form.period}
            onChange={(next) => setForm({ ...form, ...next })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto mínimo de reserva</Label>
              <Input
                type="number"
                min={0}
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Válido desde</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Válido hasta</Label>
              <Input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Diálogo de usos ---

const UsagesDialog: React.FC<{
  open: boolean;
  code: DiscountCode | null;
  onClose: () => void;
}> = ({ open, code, onClose }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [usages, setUsages] = useState<DiscountUsage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !code) return;
    setLoading(true);
    listDiscountUsages(getAccessTokenSilently, code.id)
      .then((data) => setUsages(data.usages || []))
      .catch(() => toast.error('No se pudieron cargar los usos'))
      .finally(() => setLoading(false));
  }, [open, code, getAccessTokenSilently]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usos de {code?.code}</DialogTitle>
          <DialogDescription>Quién usó el código y en qué reserva.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : usages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Todavía no hay usos para este código.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reserva</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usages.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell className="font-mono text-xs">{usage.booking_code || '—'}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">{usage.customer_name || '—'}</p>
                    <p className="text-xs text-slate-500">{usage.customer_email || ''}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-emerald-600">-{money(usage.discount_amount)}</p>
                    <p className="text-xs text-slate-500">Pagó {money(usage.final_amount)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{usage.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{dateLabel(usage.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

// --- Componente principal ---

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
    exhausted: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-slate-100 text-slate-600 border-slate-200',
    voided: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const labels: Record<string, string> = {
    available: 'Disponible',
    scheduled: 'Programado',
    exhausted: 'Utilizado',
    expired: 'Vencido',
    voided: 'Anulado',
    active: 'Activo',
    suspended: 'Suspendido',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[status] || status}
    </span>
  );
};

export const AdminMembers: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const adminSpaces = useBookingStore((state) => state.adminSpaces);
  const fetchAdminSpaces = useBookingStore((state) => state.fetchAdminSpaces);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planDialog, setPlanDialog] = useState<{ open: boolean; plan: MembershipPlan | null }>({ open: false, plan: null });
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [batchOpen, setBatchOpen] = useState(false);
  const [usageCode, setUsageCode] = useState<DiscountCode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, membersRes, codesRes] = await Promise.all([
        listPlans(getAccessTokenSilently),
        listMembers(getAccessTokenSilently),
        listDiscountCodes(getAccessTokenSilently),
      ]);
      setPlans(plansRes.plans || []);
      setMembers(membersRes.members || []);
      setCodes(codesRes.codes || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los socios');
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    loadAll();
    if (adminSpaces.length === 0) {
      fetchAdminSpaces(getAccessTokenSilently).catch(() => undefined);
    }
  }, [loadAll, adminSpaces.length, fetchAdminSpaces, getAccessTokenSilently]);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.name, member.email, member.document_number, member.plan_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [members, query]);

  const filteredCodes = useMemo(() => {
    return codes.filter((code) => {
      if (statusFilter !== 'all' && code.derived_status !== statusFilter) return false;
      const term = query.trim().toLowerCase();
      if (!term) return true;
      return [code.code, code.batch_id].filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
    });
  }, [codes, query, statusFilter]);

  const handleDeleteMember = async (member: Member) => {
    if (!window.confirm(`¿Eliminar a ${member.name} de los socios?`)) return;
    setBusyId(member.id);
    try {
      await deleteMember(getAccessTokenSilently, member.id);
      toast.success('Socio eliminado');
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el socio');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    if (!window.confirm(`¿Desactivar el plan ${plan.name}?`)) return;
    setBusyId(plan.id);
    try {
      await deletePlan(getAccessTokenSilently, plan.id);
      toast.success('Plan desactivado');
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar el plan');
    } finally {
      setBusyId(null);
    }
  };

  const handleVoidCode = async (code: DiscountCode) => {
    if (!window.confirm(`¿Anular el código ${code.code}?`)) return;
    setBusyId(code.id);
    try {
      await voidDiscountCode(getAccessTokenSilently, code.id);
      toast.success('Código anulado');
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo anular el código');
    } finally {
      setBusyId(null);
    }
  };

  const handleVoidBatch = async (code: DiscountCode) => {
    if (!code.batch_id) return;
    if (!window.confirm('¿Anular todos los códigos de este lote?')) return;
    setBusyId(code.batch_id);
    try {
      await voidDiscountBatch(getAccessTokenSilently, code.batch_id);
      toast.success('Lote anulado');
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo anular el lote');
    } finally {
      setBusyId(null);
    }
  };

  const handleExport = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(exportDiscountCodesUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo exportar');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'codigos.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo exportar');
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-slate-900">Socios y descuentos</h1>
          <p className="text-sm text-slate-500">
            Administra membresías, socios y códigos promocionales de tu centro.
          </p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1">
          <TabsTrigger value="members" className="rounded-lg">
            <Users className="h-4 w-4 mr-2" /> Socios
          </TabsTrigger>
          <TabsTrigger value="plans" className="rounded-lg">
            <BadgePercent className="h-4 w-4 mr-2" /> Planes
          </TabsTrigger>
          <TabsTrigger value="codes" className="rounded-lg">
            <Ticket className="h-4 w-4 mr-2" /> Códigos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, RUT o correo"
                className="pl-9"
              />
            </div>
            <Button onClick={() => setMemberDialog({ open: true, member: null })} disabled={plans.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo socio
            </Button>
          </div>

          {plans.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Primero crea un plan de socio en la pestaña <strong>Planes</strong>.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                      No hay socios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{member.document_number}</TableCell>
                      <TableCell className="text-sm">{member.plan_name || '—'}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {dateLabel(member.valid_from)} → {dateLabel(member.valid_to)}
                      </TableCell>
                      <TableCell>{statusBadge(member.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberDialog({ open: true, member })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={busyId === member.id}
                            onClick={() => handleDeleteMember(member)}
                          >
                            {busyId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPlanDialog({ open: true, plan: null })}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo plan
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Aún no tienes planes de socio. Crea el primero para empezar a registrar socios.
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{plan.name}</h3>
                      {plan.description && <p className="text-xs text-slate-500 mt-1">{plan.description}</p>}
                    </div>
                    {statusBadge(plan.active ? 'active' : 'suspended')}
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-2xl font-bold text-slate-900">
                      {discountLabel(plan.discount.type, plan.discount.value)}
                    </p>
                    <p className="text-xs text-slate-500">Aplica a {scopeLabel(plan.scope)}</p>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>
                      Por persona:{' '}
                      {plan.usage_limit.max_uses_per_user
                        ? `${plan.usage_limit.max_uses_per_user} ${periodPhrase(plan.usage_limit.period)}`
                        : 'sin límite'}
                    </p>
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setPlanDialog({ open: true, plan })}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === plan.id}
                      onClick={() => handleDeletePlan(plan)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar código o lote"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="scheduled">Programados</SelectItem>
                  <SelectItem value="exhausted">Utilizados</SelectItem>
                  <SelectItem value="expired">Vencidos</SelectItem>
                  <SelectItem value="voided">Anulados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <Button onClick={() => setBatchOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Generar códigos
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Alcance</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                      No hay códigos que coincidan con el filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <p className="font-mono text-sm font-semibold text-slate-800">{code.code}</p>
                        {code.batch_id && (
                          <p className="text-[11px] text-slate-400">Lote {code.batch_id.slice(-6)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {discountLabel(code.discount.type, code.discount.value)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{scopeLabel(code.scope)}</TableCell>
                      <TableCell className="text-sm">
                        {code.used_count}
                        {code.usage_limit.max_uses ? ` / ${code.usage_limit.max_uses}` : ''}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {dateLabel(code.valid_from)} → {dateLabel(code.valid_to)}
                      </TableCell>
                      <TableCell>{statusBadge(code.derived_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setUsageCode(code)}>
                            Usos
                          </Button>
                          {code.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === code.id}
                              onClick={() => handleVoidCode(code)}
                            >
                              Anular
                            </Button>
                          )}
                          {code.batch_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busyId === code.batch_id}
                              onClick={() => handleVoidBatch(code)}
                            >
                              <CalendarClock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <PlanDialog
        open={planDialog.open}
        plan={planDialog.plan}
        spaces={adminSpaces}
        onClose={() => setPlanDialog({ open: false, plan: null })}
        onSaved={loadAll}
      />
      <MemberDialog
        open={memberDialog.open}
        member={memberDialog.member}
        plans={plans}
        onClose={() => setMemberDialog({ open: false, member: null })}
        onSaved={loadAll}
      />
      <BatchDialog
        open={batchOpen}
        spaces={adminSpaces}
        onClose={() => setBatchOpen(false)}
        onSaved={loadAll}
      />
      <UsagesDialog open={!!usageCode} code={usageCode} onClose={() => setUsageCode(null)} />
    </div>
  );
};
