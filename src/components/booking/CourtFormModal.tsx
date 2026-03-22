import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Court } from '../../types';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '../../store/useBookingStore';
import { toast } from 'sonner';

interface CourtFormModalProps {
  court: Court | null;
  onClose: () => void;
  onSave: (court: Court) => void;
}

const CourtFormModal: React.FC<CourtFormModalProps> = ({ court, onClose, onSave }) => {
  const { adminCourts, createAdminCourt, updateAdminCourt } = useBookingStore();
  const { getAccessTokenSilently } = useAuth0();

  // Handle default centerId logic safely dealing with different ID formats
  const getDefaultCenterId = () => {
    if (adminCourts && adminCourts.length > 0) {
      return adminCourts[0].sport_center?.id || adminCourts[0].sport_center?._id || '';
    }
    return '';
  };

  const [formData, setFormData] = useState<Court>(
    court || {
      id: Date.now().toString(),
      name: '',
      type: '',
      image: '',
      centerId: getDefaultCenterId()
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.centerId) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      if (court) {
        const payload = {
          name: formData.name,
          description: formData.type
        };
        await updateAdminCourt(court.id, payload, getAccessTokenSilently);
        onSave(formData);
        toast.success('Cancha editada exitosamente');
      } else {
        // Enlazar con el backend real para creación a través del store
        const payload = {
          sport_center_id: formData.centerId,
          name: formData.name,
          description: formData.type // Usamos type como description para hacer coincidir el esquema
        };

        const savedCourt = await createAdminCourt(payload, getAccessTokenSilently);

        // Pasamos el nuevo court que retorna el backend o el form temporal (enrutando el nuevo ID)
        onSave({
          ...formData,
          id: savedCourt.id || savedCourt._id,
        });
        toast.success('Cancha creada y vinculada al centro con éxito');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Error al guardar la cancha en el servidor');
    }
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro Deportivo</label>
            <select
              disabled={!!court}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none bg-white disabled:bg-slate-50"
              value={formData.centerId}
              onChange={e => setFormData({ ...formData, centerId: e.target.value })}
            >
              {(!adminCourts || adminCourts.length === 0) && (
                <option value="">No hay centros disponibles</option>
              )}
              {adminCourts?.map((ac: any) => {
                const id = ac.sport_center?.id || ac.sport_center?._id;
                return (
                  <option key={id} value={id}>
                    {ac.sport_center?.name}
                  </option>
                );
              })}
            </select>
          </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              placeholder="ej: Cancha de pasto sintético con iluminación profesional"
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
