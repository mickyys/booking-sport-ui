"use client";

import React, { useMemo, useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';

export const TIPO_ESPACIO = ['cancha', 'quincho', 'sede', 'piscina'] as const;
export type TipoEspacio = (typeof TIPO_ESPACIO)[number];

export const TIPO_ESPACIO_LABELS: Record<TipoEspacio, string> = {
    cancha: 'Cancha',
    quincho: 'Quincho',
    sede: 'Sede',
    piscina: 'Piscina',
};

export interface SlotFranja {
    start_time: string;
    end_time: string;
    price: number;
    payment_required?: boolean;
    payment_optional?: boolean;
}

export interface RuleSemanal {
    days_of_week: number[];
    slots: SlotFranja[];
    active: boolean;
}

// Template de configuración por tipo de espacio (RES-24).
export interface SpaceTemplate {
    tipo: TipoEspacio;
    cantidad: number;
    cancha: boolean;
    rules?: RuleSemanal[];
    price_all_day?: number;
    price_half_day?: number;
    price_per_day?: number;
    price_per_month?: number;
}

const DIA_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

const emptySlot = (): SlotFranja => ({
    start_time: '09:00',
    end_time: '10:00',
    price: 0,
});

const emptyRule = (): RuleSemanal => ({
    days_of_week: [1],
    slots: [emptySlot()],
    active: true,
});

interface SpaceTemplatesEditorProps {
    value: SpaceTemplate[];
    onChange: (templates: SpaceTemplate[]) => void;
}

// Genera una plantilla vacía para un tipo, con la cantidad indicada.
function makeTemplate(tipo: TipoEspacio, cantidad: number): SpaceTemplate {
    return {
        tipo,
        cantidad,
        cancha: tipo === 'cancha',
        rules: tipo === 'cancha' ? [emptyRule()] : undefined,
    };
}

export const SpaceTemplatesEditor: React.FC<SpaceTemplatesEditorProps> = ({
    value,
    onChange,
}) => {
    const [selectedTipo, setSelectedTipo] = useState<TipoEspacio | null>(
        value[0]?.tipo ?? null,
    );

    const selected = useMemo(
        () => value.find((p) => p.tipo === selectedTipo) ?? null,
        [value, selectedTipo],
    );

    const updateTemplate = (tipo: TipoEspacio, patch: Partial<SpaceTemplate>) => {
        onChange(value.map((p) => (p.tipo === tipo ? { ...p, ...patch } : p)));
    };

    const handleToggle = (tipo: TipoEspacio) => {
        if (value.some((p) => p.tipo === tipo)) {
            const next = value.filter((p) => p.tipo !== tipo);
            onChange(next);
            if (selectedTipo === tipo) setSelectedTipo(next[0]?.tipo ?? null);
        } else {
            const next = [...value, makeTemplate(tipo, 1)];
            onChange(next);
            setSelectedTipo(tipo);
        }
    };

    const handleCantidad = (tipo: TipoEspacio, raw: string) => {
        const parsed = raw === '' ? 0 : Number(raw);
        const cantidad = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
        updateTemplate(tipo, { cantidad });
    };

    // -------- Copiar configuración de un tipo a otro --------
    const copyTo = (target: TipoEspacio) => {
        if (!selected || selected.tipo === target) return;
        const src = selected;
        const patch: Partial<SpaceTemplate> = {
            cancha: src.cancha,
            rules: src.cancha ? JSON.parse(JSON.stringify(src.rules ?? [])) : undefined,
            price_all_day: src.price_all_day,
            price_half_day: src.price_half_day,
            price_per_day: src.price_per_day,
            price_per_month: src.price_per_month,
        };
        updateTemplate(target, patch);
        toast.success(`Configuración de ${TIPO_ESPACIO_LABELS[selected.tipo]} copiada a ${TIPO_ESPACIO_LABELS[target]}`);
    };

    // -------- Edición de reglas (cancha) --------
    const updateRule = (ruleIdx: number, patch: Partial<RuleSemanal>) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        rules[ruleIdx] = { ...rules[ruleIdx], ...patch };
        updateTemplate(selected.tipo, { rules });
    };

    const addRule = () => {
        if (!selected) return;
        updateTemplate(selected.tipo, {
            rules: [...(selected.rules ?? []), emptyRule()],
        });
    };

    const removeRule = (ruleIdx: number) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        rules.splice(ruleIdx, 1);
        updateTemplate(selected.tipo, { rules });
    };

    const toggleRuleDay = (ruleIdx: number, day: number) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        const rule = rules[ruleIdx];
        const days = rule.days_of_week.includes(day)
            ? rule.days_of_week.filter((d) => d !== day)
            : [...rule.days_of_week, day].sort((a, b) => a - b);
        rules[ruleIdx] = { ...rule, days_of_week: days };
        updateTemplate(selected.tipo, { rules });
    };

    const updateSlot = (ruleIdx: number, slotIdx: number, patch: Partial<SlotFranja>) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        const slots = [...(rules[ruleIdx].slots ?? [])];
        slots[slotIdx] = { ...slots[slotIdx], ...patch };
        rules[ruleIdx] = { ...rules[ruleIdx], slots };
        updateTemplate(selected.tipo, { rules });
    };

    const addSlot = (ruleIdx: number) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        rules[ruleIdx] = { ...rules[ruleIdx], slots: [...rules[ruleIdx].slots, emptySlot()] };
        updateTemplate(selected.tipo, { rules });
    };

    const removeSlot = (ruleIdx: number, slotIdx: number) => {
        if (!selected) return;
        const rules = [...(selected.rules ?? [])];
        const slots = [...rules[ruleIdx].slots];
        slots.splice(slotIdx, 1);
        rules[ruleIdx] = { ...rules[ruleIdx], slots };
        updateTemplate(selected.tipo, { rules });
    };

    const total = value.reduce((acc, p) => acc + p.cantidad, 0);
    const typesSelected = value.filter((p) => p.cantidad > 0);

    return (
        <div className="space-y-5">
            {/* Selector de tipos */}
            <div>
                <Label className="font-semibold text-slate-700">
                    Tipos de espacio
                    <span aria-hidden="true" className="text-red-500">*</span>
                </Label>
                <div role="group" aria-label="Tipos de espacio" className="mt-2 flex flex-wrap gap-2">
                    {TIPO_ESPACIO.map((tipo) => {
                        const active = value.some((p) => p.tipo === tipo);
                        return (
                            <button
                                key={tipo}
                                type="button"
                                aria-pressed={active}
                                onClick={() => handleToggle(tipo)}
                                className={cn(
                                    'h-11 rounded-full border px-5 text-sm font-semibold transition-colors active:scale-[0.98]',
                                    active
                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                                )}
                            >
                                {TIPO_ESPACIO_LABELS[tipo]}
                            </button>
                        );
                    })}
                </div>
                {total === 0 && (
                    <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                        Registra al menos un tipo de espacio.
                    </p>
                )}
            </div>

            {/* Cantidad por tipo */}
            {value.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {value.map((p) => (
                        <div
                            key={p.tipo}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                            <label
                                htmlFor={`cant-${p.tipo}`}
                                className="text-sm font-medium text-slate-700"
                            >
                                {TIPO_ESPACIO_LABELS[p.tipo]}
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id={`cant-${p.tipo}`}
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={1}
                                    value={p.cantidad}
                                    onChange={(e) => handleCantidad(p.tipo, e.target.value)}
                                    className="h-9 w-20 border-slate-300 text-center font-semibold"
                                />
                                <span className="text-sm text-slate-500">unidad{p.cantidad === 1 ? '' : 'es'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor por tipo seleccionado */}
            {selected && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900">
                            {TIPO_ESPACIO_LABELS[selected.tipo]} · {selected.cantidad}{' '}
                            unidad{selected.cantidad === 1 ? '' : 'es'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Copiar a:</span>
                            {TIPO_ESPACIO.filter(
                                (t) => t !== selected.tipo && value.some((p) => p.tipo === t),
                            ).map((t) => (
                                <Button
                                    key={t}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyTo(t)}
                                    className="h-8 border-slate-300 text-xs"
                                >
                                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                    {TIPO_ESPACIO_LABELS[t]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {selected.cancha ? (
                        <div className="space-y-4">
                            {selected.rules?.map((rule, ruleIdx) => (
                                <div key={ruleIdx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Regla {ruleIdx + 1}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeRule(ruleIdx)}
                                            className="text-slate-400 hover:text-red-600"
                                            aria-label={`Eliminar regla ${ruleIdx + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Días */}
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                            const on = rule.days_of_week.includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => toggleRuleDay(ruleIdx, day)}
                                                    className={cn(
                                                        'h-8 w-8 rounded-full text-xs font-semibold transition-colors',
                                                        on
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white text-slate-500 border border-slate-200',
                                                    )}
                                                >
                                                    {DIA_LABELS[day]}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Franjas */}
                                    <div className="space-y-2">
                                        {rule.slots.map((slot, slotIdx) => (
                                            <div key={slotIdx} className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={slot.start_time}
                                                    onChange={(e) =>
                                                        updateSlot(ruleIdx, slotIdx, { start_time: e.target.value })
                                                    }
                                                    className="h-9 w-24 border-slate-300 text-sm"
                                                />
                                                <span className="text-slate-400">a</span>
                                                <Input
                                                    type="time"
                                                    value={slot.end_time}
                                                    onChange={(e) =>
                                                        updateSlot(ruleIdx, slotIdx, { end_time: e.target.value })
                                                    }
                                                    className="h-9 w-24 border-slate-300 text-sm"
                                                />
                                                <div className="relative flex-1">
                                                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={500}
                                                        value={slot.price}
                                                        onChange={(e) =>
                                                            updateSlot(ruleIdx, slotIdx, {
                                                                price: Number(e.target.value) || 0,
                                                            })
                                                        }
                                                        className="h-9 w-full border-slate-300 pl-7 text-sm"
                                                        placeholder="Precio"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSlot(ruleIdx, slotIdx)}
                                                    className="text-slate-400 hover:text-red-600"
                                                    aria-label="Eliminar franja"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addSlot(ruleIdx)}
                                        className="mt-2 h-8 text-xs text-emerald-700"
                                    >
                                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                        Agregar franja
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRule}
                                className="h-9 border-slate-300 text-sm"
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Agregar regla semanal
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {selected.tipo === 'quincho' && (
                                <>
                                    <FacilityPriceInput
                                        label="Precio día completo"
                                        value={selected.price_all_day ?? 0}
                                        onChange={(v) => updateTemplate(selected.tipo, { price_all_day: v })}
                                    />
                                    <FacilityPriceInput
                                        label="Precio medio día"
                                        value={selected.price_half_day ?? 0}
                                        onChange={(v) => updateTemplate(selected.tipo, { price_half_day: v })}
                                    />
                                </>
                            )}
                            {(selected.tipo === 'sede' || selected.tipo === 'piscina') && (
                                <>
                                    <FacilityPriceInput
                                        label="Precio por día"
                                        value={selected.price_per_day ?? 0}
                                        onChange={(v) => updateTemplate(selected.tipo, { price_per_day: v })}
                                    />
                                    <FacilityPriceInput
                                        label="Precio por mes"
                                        value={selected.price_per_month ?? 0}
                                        onChange={(v) => updateTemplate(selected.tipo, { price_per_month: v })}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Selector del tipo a editar */}
            {value.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((p) => (
                        <button
                            key={p.tipo}
                            type="button"
                            onClick={() => setSelectedTipo(p.tipo)}
                            className={cn(
                                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                                selectedTipo === p.tipo
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 bg-white text-slate-600',
                            )}
                        >
                            {TIPO_ESPACIO_LABELS[p.tipo]}
                        </button>
                    ))}
                </div>
            )}

            {typesSelected.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {total} espacio{total === 1 ? '' : 's'} en total
                </div>
            )}
        </div>
    );
};

const FacilityPriceInput: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
            <Input
                type="number"
                min={0}
                step={500}
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="h-10 w-full border-slate-300 pl-7"
            />
        </div>
    </div>
);

export default SpaceTemplatesEditor;