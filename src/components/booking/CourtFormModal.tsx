import React, { useState } from 'react';
import { Calendar, DollarSign, AlertCircle, Ban, Plus, Edit, Trash2, Save } from 'lucide-react';
import { format, parseISO, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, TimeSlot, Court } from '../../types';

interface CourtFormModalProps {
  court: Court | null;
  onClose: () => void;
  onSave: (court: Court) => void;
}

const CourtFormModal: React.FC<CourtFormModalProps> = ({ court, onClose, onSave }) => {
  const [formData, setFormData] = useState<Court>(
    court || {
      id: Date.now().toString(),
      name: '',
      shortName: '',
      type: '',
      image: '',
      centerId: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shortName || !formData.type) {
      alert('Por favor completa todos los campos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">{court ? 'Editar Cancha' : 'Nueva Cancha'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            X
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="ej: Cancha Principal (Techada)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Corto</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
              value={formData.shortName}
              onChange={e => setFormData({ ...formData, shortName: e.target.value })}
              placeholder="ej: Cancha 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Superficie</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              placeholder="ej: Pasto Sintético PRO"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              placeholder="URL de la imagen"
            />
            {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtFormModal;
