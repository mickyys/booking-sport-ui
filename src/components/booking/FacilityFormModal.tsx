"use client";

import React, { useState } from 'react';
import { X, Save, Building, Waves, Trees } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Facility, FacilityType } from '@/types';

interface FacilityFormModalProps {
  facility: Facility | null;
  onClose: () => void;
  onSave: (facility: Facility) => void;
}

const TYPE_OPTIONS: { value: FacilityType; label: string; icon: React.ReactNode }[] = [
  { value: 'quincho', label: 'Quincho', icon: <Trees className="w-4 h-4" /> },
  { value: 'sede', label: 'Sede', icon: <Building className="w-4 h-4" /> },
  { value: 'piscina', label: 'Piscina', icon: <Waves className="w-4 h-4" /> },
];

const AVAILABLE_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const FacilityFormModal: React.FC<FacilityFormModalProps> = ({ facility, onClose, onSave }) => {
  const isEdit = !!facility;

  const [type, setType] = useState<FacilityType>(facility?.type || 'quincho');
  const [name, setName] = useState(facility?.name || '');
  const [description, setDescription] = useState(facility?.description || '');
  const [imageUrl, setImageUrl] = useState(facility?.image_url || facility?.image || '');
  const [capacity, setCapacity] = useState<number>(facility?.capacity || 0);
  const [area, setArea] = useState(facility?.area || '');
  const [features, setFeatures] = useState<string>((facility?.features || []).join(', '));
  const [priceAllDay, setPriceAllDay] = useState<number>(facility?.price_all_day || 0);
  const [priceHalfDay, setPriceHalfDay] = useState<number>(facility?.price_half_day || 0);
  const [openHour, setOpenHour] = useState<number>(facility?.open_hour ?? 9);
  const [closeHour, setCloseHour] = useState<number>(facility?.close_hour ?? 22);
  const [pricePerDay, setPricePerDay] = useState<number>(facility?.price_per_day || 0);
  const [pricePerMonth, setPricePerMonth] = useState<number>(facility?.price_per_month || 0);
  const [minMonths, setMinMonths] = useState<number>(facility?.min_months || 1);
  const [maxMonths, setMaxMonths] = useState<number>(facility?.max_months || 12);
  const [depositMonths, setDepositMonths] = useState<number>(facility?.deposit_months || 1);
  const [availableMonths, setAvailableMonths] = useState<number[]>(facility?.available_months || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  const toggleMonth = (m: number) => {
    setAvailableMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const data: Facility = {
      id: facility?.id || '',
      type,
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      capacity,
      area: area.trim(),
      features: features.split(',').map((s) => s.trim()).filter(Boolean),
      enabled: true,
      ...(type === 'quincho'
        ? { price_all_day: priceAllDay, price_half_day: priceHalfDay, open_hour: openHour, close_hour: closeHour }
        : {
            price_per_day: pricePerDay,
            price_per_month: pricePerMonth,
            min_months: minMonths,
            max_months: maxMonths,
            deposit_months: depositMonths,
            available_months: availableMonths,
          }),
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{isEdit ? 'Editar Facility' : 'Nueva Facility'}</h3>
            <p className="text-sm text-slate-500">Quinchos, sedes y piscinas arrendables</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de espacio</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  disabled={isEdit}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    type === opt.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  } ${isEdit ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quincho Principal"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe el espacio, capacidad y usos..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {type === 'quincho' ? 'Capacidad (personas)' : 'Máximo de personas (opcional)'}
              </label>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
              {type !== 'quincho' && (
                <p className="mt-1 text-xs text-slate-500">Solo informativo: se muestra a los clientes, no limita las reservas. Déjalo en 0 si no aplica.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área / dimensiones</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="140 m²"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Características (separadas por coma)</label>
              <input
                type="text"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Parrilla, Cocina, Mesas, Baños..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Quincho fields */}
          {type === 'quincho' && (
            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-base font-bold text-slate-900 mb-4">Precios (Quincho)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Día completo</label>
                  <input
                    type="number"
                    min={0}
                    value={priceAllDay}
                    onChange={(e) => setPriceAllDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medio día</label>
                  <input
                    type="number"
                    min={0}
                    value={priceHalfDay}
                    onChange={(e) => setPriceHalfDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Abre (hora)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={openHour}
                    onChange={(e) => setOpenHour(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cierra (hora)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={closeHour}
                    onChange={(e) => setCloseHour(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sede/Piscina fields */}
          {type !== 'quincho' && (
            <div className="border-t border-slate-200 pt-5 space-y-5">
              <h4 className="text-base font-bold text-slate-900">Precios ({type === 'sede' ? 'Sede' : 'Piscina'})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio por día</label>
                  <input
                    type="number"
                    min={0}
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio por mes</label>
                  <input
                    type="number"
                    min={0}
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mínimo (meses)</label>
                  <input
                    type="number"
                    min={1}
                    value={minMonths}
                    onChange={(e) => setMinMonths(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Máximo (meses)</label>
                  <input
                    type="number"
                    min={1}
                    value={maxMonths}
                    onChange={(e) => setMaxMonths(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mes de garantía</label>
                <input
                  type="number"
                  min={0}
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meses disponibles para arriendo</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MONTHS.map((m, i) => {
                    const active = availableMonths.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleMonth(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all"
            >
              <Save className="w-4 h-4" />
              {isEdit ? 'Guardar Cambios' : 'Crear Facility'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default FacilityFormModal;