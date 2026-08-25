"use client";

import React, { useState } from 'react';
import { X, Save, Building, Waves, Trees, Trophy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Space, SpaceCategory } from '@/types';
import { CourtImageUpload, uploadImageToCloudinary } from './CourtImageUpload';

interface SpaceFormModalProps {
  space: Space | null;
  onClose: () => void;
  onSave: (space: Space) => Promise<void> | void;
  currentSportCenter?: { id?: string; _id?: string; name?: string } | null;
}

const CATEGORY_OPTIONS: { value: SpaceCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'cancha', label: 'Cancha', icon: <Trophy className="w-4 h-4" /> },
  { value: 'quincho', label: 'Quincho', icon: <Trees className="w-4 h-4" /> },
  { value: 'sede', label: 'Sede', icon: <Building className="w-4 h-4" /> },
  { value: 'piscina', label: 'Piscina', icon: <Waves className="w-4 h-4" /> },
];

const AVAILABLE_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const SpaceFormModal: React.FC<SpaceFormModalProps> = ({ space, onClose, onSave, currentSportCenter }) => {
  const isEdit = !!space;

  const [category, setCategory] = useState<SpaceCategory>(space?.category || 'cancha');
  const [name, setName] = useState(space?.name || '');
  const [description, setDescription] = useState(space?.description || '');
  const [imageUrl, setImageUrl] = useState(space?.image_url || space?.image || '');
  const [yPosition, setYPosition] = useState(space?.y_position || 0);
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<number>(space?.capacity || 0);
  const [area, setArea] = useState(space?.area || '');
  const [features, setFeatures] = useState<string>((space?.features || []).join(', '));
  const [priceAllDay, setPriceAllDay] = useState<number>(space?.price_all_day || 0);
  const [priceHalfDay, setPriceHalfDay] = useState<number>(space?.price_half_day || 0);
  const [openHour, setOpenHour] = useState<number>(space?.open_hour ?? 9);
  const [closeHour, setCloseHour] = useState<number>(space?.close_hour ?? 22);
  const [pricePerDay, setPricePerDay] = useState<number>(space?.price_per_day || 0);
  const [pricePerMonth, setPricePerMonth] = useState<number>(space?.price_per_month || 0);
  const [minMonths, setMinMonths] = useState<number>(space?.min_months || 1);
  const [maxMonths, setMaxMonths] = useState<number>(space?.max_months || 12);
  const [depositMonths, setDepositMonths] = useState<number>(space?.deposit_months || 1);
  const [availableMonths, setAvailableMonths] = useState<number[]>(space?.available_months || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleMonth = (m: number) => {
    setAvailableMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)));
  };

  const handleImageUrlChange = (url: string, yPos?: number) => {
    setImageUrl(url);
    if (yPos !== undefined) setYPosition(yPos);
  };

  const handleFileSelect = (file: File) => {
    setLocalImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setLocalImageFile(null);
    setLocalImagePreview(null);
    setImageUrl('');
    setYPosition(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      let image = imageUrl;
      if (localImageFile) {
        toast.info('Subiendo imagen...');
        image = await uploadImageToCloudinary(localImageFile);
      }

      let data: Space;
      if (category === 'cancha') {
        data = {
          id: space?.id || '',
          category,
          name: name.trim(),
          description: description.trim(),
          image_url: image,
          image,
          y_position: yPosition,
          capacity: 0,
          area: '',
          features: [],
        };
      } else {
        data = {
          id: space?.id || '',
          category,
          name: name.trim(),
          description: description.trim(),
          image_url: image,
          image,
          capacity,
          area: area.trim(),
          features: features.split(',').map((s) => s.trim()).filter(Boolean),
          enabled: true,
          ...(category === 'quincho'
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
      }

      await onSave(data);
      setLocalImageFile(null);
      setLocalImagePreview(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Error al guardar el espacio');
    } finally {
      setIsSaving(false);
    }
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
            <h3 className="text-xl font-bold text-slate-900">{isEdit ? 'Editar Espacio' : 'Nuevo Espacio'}</h3>
            <p className="text-sm text-slate-500">Canchas, quinchos, sedes y piscinas</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
<button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      category === opt.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
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
                placeholder={category === 'cancha' ? 'Cancha Principal' : 'Quincho Principal'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {category === 'cancha' ? 'Descripción / Tipo' : 'Descripción'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={category === 'cancha' ? 1 : 3}
                placeholder={
                  category === 'cancha'
                    ? 'ej: Cancha de pasto sintético con iluminación profesional'
                    : 'Describe el espacio, capacidad y usos...'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <CourtImageUpload
                value={imageUrl}
                localPreview={localImagePreview}
                yPosition={yPosition}
                onUrlChange={handleImageUrlChange}
                onFileSelect={handleFileSelect}
                onRemove={handleRemoveImage}
                hasLocalFile={!!localImageFile}
                label="Imagen del Espacio"
                defaultQuery={category === 'cancha' ? `cancha ${name.trim()}` : category === 'quincho' ? 'quincho parrilla' : category === 'sede' ? 'sede evento' : 'piscina'}
              />
            </div>

            {category !== 'cancha' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (personas)</label>
                  <input
                    type="number"
                    min={0}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm"
                  />
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
              </>
            )}
          </div>

          {/* Quincho fields */}
          {category === 'quincho' && (
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
          {(category === 'sede' || category === 'piscina') && (
            <div className="border-t border-slate-200 pt-5 space-y-5">
              <h4 className="text-base font-bold text-slate-900">Precios ({category === 'sede' ? 'Sede' : 'Piscina'})</h4>
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
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Espacio'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SpaceFormModal;