import { ScheduleRule, ScheduleRuleSlot, ScheduleSource, Space, SpaceCategory } from '@/types';

// ===== Modelo de edición =====
//
// El backend persiste `ScheduleRule[]`, donde un día puede aparecer en varias
// reglas (el resolver elige la más específica). La UI trabaja con grupos donde
// cada día pertenece a un único grupo, que es mucho más simple de editar y
// evita configuraciones ambiguas.

export interface ScheduleGroup {
  id: string;
  days: number[];
  slots: ScheduleRuleSlot[];
}

export interface SpaceScheduleState {
  rules: ScheduleRule[];
  source: ScheduleSource;
  loading: boolean;
  error?: string;
}

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Orden visual de la semana (lunes primero) manteniendo el índice 0=domingo.
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// ===== Cobro por franja =====
//
// `payment_required` y `payment_optional` definen si la franja se cobra al
// reservar; `partial_payment_enabled` decide si además se ofrece el abono. La
// UI expone tres modos: sin cobro, completo y parcial (abono).

export type SlotChargeMode = 'none' | 'full' | 'partial';
export type ChargeSummary = SlotChargeMode | 'optional' | 'mixed';

export const CHARGE_MODE_LABELS: Record<SlotChargeMode, string> = {
  none: 'No cobrar',
  full: 'Completo',
  partial: 'Parcial',
};

/**
 * Deriva el modo de cobro de una franja. Devuelve `null` para el caso heredado
 * `payment_optional` (pago opcional), que ya no se ofrece en la UI.
 * `partial_payment_enabled` en `null` hereda la configuración del centro.
 */
export function chargeModeForSlot(
  slot: ScheduleRuleSlot,
  inheritedPartial = false,
): SlotChargeMode | null {
  if (slot.payment_required) {
    if (slot.partial_payment_enabled === true) return 'partial';
    if (slot.partial_payment_enabled === undefined || slot.partial_payment_enabled === null) {
      return inheritedPartial ? 'partial' : 'full';
    }
    return 'full';
  }
  if (slot.payment_optional) return null;
  return 'none';
}

export function applyChargeMode(slot: ScheduleRuleSlot, mode: SlotChargeMode): ScheduleRuleSlot {
  return {
    ...slot,
    payment_required: mode !== 'none',
    payment_optional: false,
    partial_payment_enabled: mode === 'partial',
  };
}

/**
 * Modos disponibles según la modalidad comercial del centro. El backend fuerza
 * los flags al guardar (`applyPaymentModeToSlots`), así que la UI evita ofrecer
 * combinaciones que se van a sobrescribir.
 */
export function allowedChargeModes(paymentMode?: string | null): SlotChargeMode[] {
  if (paymentMode === 'pay_at_center') return ['none'];
  if (paymentMode === 'pay_online') return ['full', 'partial'];
  return ['none', 'full', 'partial'];
}

export function chargeSummaryForSlots(
  slots: ScheduleRuleSlot[],
  inheritedPartial = false,
): ChargeSummary {
  if (!slots || slots.length === 0) return 'none';
  const modes = new Set(
    slots.map((slot) => {
      const mode = chargeModeForSlot(slot, inheritedPartial);
      return mode === null ? 'optional' : mode;
    }),
  );
  if (modes.size === 1) return Array.from(modes)[0] as ChargeSummary;
  return 'mixed';
}

export function chargeSummaryLabel(summary: ChargeSummary): string {
  if (summary === 'mixed') return 'Cobro mixto';
  if (summary === 'optional') return 'Pago opcional';
  if (summary === 'none') return 'Sin cobro';
  return summary === 'partial' ? 'Cobro parcial' : 'Cobro completo';
}

let groupSeq = 0;

export function createGroupId(): string {
  groupSeq += 1;
  return `g-${Date.now().toString(36)}-${groupSeq}`;
}

export function minutesFromTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value || '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes > 59) return null;
  const total = hours * 60 + minutes;
  if (total < 0 || total > 1440) return null;
  return total;
}

export function timeFromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.round(total)));
  if (clamped === 1440) return '24:00';
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

export function addMinutes(value: string, minutes: number): string {
  const base = minutesFromTime(value);
  if (base === null) return value;
  return timeFromMinutes(base + minutes);
}

export function formatCLP(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (amount <= 0) return 'Gratis';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return formatCLP(min);
  return `${formatCLP(min)} – ${formatCLP(max)}`;
}

export function formatDays(days: number[]): string {
  const unique = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6)));
  if (unique.length === 0) return 'Sin días';
  if (unique.length === 7) return 'Todos los días';

  const sorted = DAY_ORDER.filter((d) => unique.includes(d));
  const runs: number[][] = [];
  for (const day of sorted) {
    const last = runs[runs.length - 1];
    if (last && DAY_ORDER.indexOf(day) === DAY_ORDER.indexOf(last[last.length - 1]) + 1) {
      last.push(day);
    } else {
      runs.push([day]);
    }
  }

  return runs
    .map((run) => {
      if (run.length === 1) return DAY_SHORT[run[0]];
      return `${DAY_SHORT[run[0]]}–${DAY_SHORT[run[run.length - 1]]}`;
    })
    .join(', ');
}

export function dayOwnerMap(groups: ScheduleGroup[]): Map<number, string> {
  const owners = new Map<number, string>();
  for (const group of groups) {
    for (const day of group.days) owners.set(day, group.id);
  }
  return owners;
}

export function freeDays(groups: ScheduleGroup[]): number[] {
  const owners = dayOwnerMap(groups);
  return DAY_ORDER.filter((day) => !owners.has(day));
}

export function slotForCategory(
  category: SpaceCategory,
  start = '09:00',
  end = '10:00',
  price = 0,
  chargeMode: SlotChargeMode = 'none',
): ScheduleRuleSlot {
  const charge = {
    payment_required: chargeMode !== 'none',
    payment_optional: false,
    partial_payment_enabled: chargeMode === 'partial',
  };
  if (category === 'sede' || category === 'piscina') {
    return { start_time: '00:00', end_time: '24:00', price: 0, ...charge };
  }
  return {
    start_time: start,
    end_time: end,
    price: category === 'cancha' ? Math.max(0, Math.round(price)) : 0,
    ...charge,
  };
}

export function defaultRangeForSpace(space: Space): { start: string; end: string } {
  if (space.category === 'quincho') {
    const startHour = space.open_hour && space.open_hour > 0 ? space.open_hour : 12;
    const endHour = space.close_hour && space.close_hour > startHour ? space.close_hour : 23;
    return { start: timeFromMinutes(startHour * 60), end: timeFromMinutes(endHour * 60) };
  }
  return { start: '09:00', end: '23:00' };
}

export function defaultGroupForSpace(space: Space, days: number[]): ScheduleGroup {
  const { start, end } = defaultRangeForSpace(space);
  return {
    id: createGroupId(),
    days: [...days],
    slots: [slotForCategory(space.category, start, end, 0)],
  };
}

function normalizeSlot(slot: ScheduleRuleSlot, category: SpaceCategory): ScheduleRuleSlot {
  const price = category === 'cancha' ? Math.max(0, Math.round(Number(slot.price) || 0)) : 0;
  return {
    start_time: slot.start_time || '09:00',
    end_time: slot.end_time || '10:00',
    price,
    payment_required: !!slot.payment_required,
    payment_optional: !!slot.payment_optional,
    partial_payment_enabled: slot.partial_payment_enabled ?? false,
  };
}

function sortSlots(slots: ScheduleRuleSlot[]): ScheduleRuleSlot[] {
  return [...slots].sort((a, b) => {
    const am = minutesFromTime(a.start_time) ?? 0;
    const bm = minutesFromTime(b.start_time) ?? 0;
    return am - bm;
  });
}

// Convierte reglas persistidas (o derivadas del legacy) a grupos sin días
// repetidos. Si un día aparece en varias reglas, se asigna a la más específica
// (menos días), replicando `mostSpecificRuleForDay` del backend.
export function groupsFromRules(
  rules: ScheduleRule[],
  category: SpaceCategory = 'cancha',
): ScheduleGroup[] {
  if (!rules || rules.length === 0) return [];

  const cleanRules = rules.map((rule) => ({
    ...rule,
    days_of_week: Array.from(new Set((rule.days_of_week || []).filter((d) => d >= 0 && d <= 6))),
    slots: category === 'sede' || category === 'piscina'
      ? [slotForCategory(category)]
      : sortSlots((rule.slots || []).map((slot) => normalizeSlot(slot, category))),
  }));

  const assigned: number[][] = cleanRules.map(() => []);
  for (let day = 0; day < 7; day += 1) {
    let best = -1;
    cleanRules.forEach((rule, index) => {
      if (!rule.days_of_week.includes(day)) return;
      if (best === -1 || rule.days_of_week.length < cleanRules[best].days_of_week.length) {
        best = index;
      }
    });
    if (best !== -1) assigned[best].push(day);
  }

  return cleanRules
    .map((rule, index) => ({
      id: createGroupId(),
      days: DAY_ORDER.filter((day) => assigned[index].includes(day)),
      slots: rule.slots,
    }))
    .filter((group) => group.days.length > 0 && group.slots.length > 0);
}

export function rulesFromGroups(groups: ScheduleGroup[]): ScheduleRule[] {
  return groups
    .filter((group) => group.days.length > 0 && group.slots.length > 0)
    .map((group) => ({
      days_of_week: DAY_ORDER.filter((day) => group.days.includes(day)),
      slots: sortSlots(group.slots.map((slot) => ({ ...slot }))),
      active: true,
    }));
}

export function groupsFingerprint(groups: ScheduleGroup[]): string {
  return JSON.stringify(rulesFromGroups(groups));
}

export function validateGroups(groups: ScheduleGroup[], category: SpaceCategory): string | null {
  const seenDays = new Map<number, number>();

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const label = formatDays(group.days);

    if (group.days.length === 0) {
      return `El horario ${index + 1} no tiene días seleccionados.`;
    }

    for (const day of group.days) {
      if (seenDays.has(day)) {
        return `El día ${DAY_LABELS[day]} está asignado a más de un horario.`;
      }
      seenDays.set(day, index);
    }

    if (group.slots.length === 0) {
      return `El horario de ${label} no tiene franjas.`;
    }

    if ((category === 'sede' || category === 'piscina')) {
      if (group.slots.length !== 1) {
        return `El horario de ${label} debe tener una única franja de día completo.`;
      }
      const slot = group.slots[0];
      if (slot.start_time !== '00:00' || slot.end_time !== '24:00') {
        return `El horario de ${label} debe ser de 00:00 a 24:00.`;
      }
      continue;
    }

    if (category === 'quincho' && group.slots.length !== 1) {
      return `El horario de ${label} debe tener un único rango de disponibilidad.`;
    }

    let previousEnd = -1;
    for (const slot of group.slots) {
      const start = minutesFromTime(slot.start_time);
      const end = minutesFromTime(slot.end_time);
      if (start === null || end === null) {
        return `Hay una hora inválida en ${label}.`;
      }
      if (end <= start) {
        return `La hora de fin debe ser mayor que la de inicio en ${label}.`;
      }
      if (start < previousEnd) {
        return `Las franjas de ${label} se superponen.`;
      }
      if (category === 'cancha' && (!Number.isFinite(slot.price) || slot.price < 0)) {
        return `El precio de ${label} debe ser mayor o igual a 0.`;
      }
      previousEnd = end;
    }
  }

  return null;
}

export function groupSummary(group: ScheduleGroup, category: SpaceCategory): string {
  const days = formatDays(group.days);
  if (category === 'sede' || category === 'piscina') return `${days} · Día completo`;
  if (category === 'quincho') {
    const slot = group.slots[0];
    return slot ? `${days} · ${slot.start_time}–${slot.end_time}` : `${days} · Sin rango`;
  }

  const slots = sortSlots(group.slots);
  if (slots.length === 0) return `${days} · Sin franjas`;
  if (slots.length === 1) {
    return `${days} · ${slots[0].start_time}–${slots[0].end_time} · ${formatCLP(slots[0].price)}`;
  }
  const prices = slots.map((slot) => slot.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `${days} · ${slots.length} franjas · ${formatPriceRange(min, max)}`;
}

export function priceRangeForGroups(groups: ScheduleGroup[]): { min: number; max: number; count: number } | null {
  const prices = groups.flatMap((group) => group.slots.map((slot) => Number(slot.price) || 0));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices), count: groups.length };
}

export function facilityPriceSummary(space: Space): string | null {
  if (space.category === 'quincho') {
    const parts: string[] = [];
    if (space.price_all_day) parts.push(`Día completo ${formatCLP(space.price_all_day)}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  if (space.category === 'sede' || space.category === 'piscina') {
    const parts: string[] = [];
    if (space.price_per_day) parts.push(`${formatCLP(space.price_per_day)} / día`);
    if (space.price_per_month) parts.push(`${formatCLP(space.price_per_month)} / mes`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }
  return null;
}

export function sourceLabel(source: ScheduleSource): string {
  if (source === 'legacy') return 'Horario anterior';
  if (source === 'none') return 'Sin horario';
  return 'Configurado';
}

export function toDateInput(value: string): string {
  return (value || '').slice(0, 10);
}

export function hasRules(groups: ScheduleGroup[]): boolean {
  return groups.some((group) => group.days.length > 0 && group.slots.length > 0);
}
