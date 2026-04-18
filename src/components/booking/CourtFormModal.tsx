"use client";
import React, { useState, useRef } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Court } from '../../types';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '../../store/useBookingStore';
import { toast } from 'sonner';
import { CourtImageUpload, uploadImageToCloudinary } from './CourtImageUpload';

interface CourtFormModalProps {
  court: Court | null;
  onClose: () => void;
  onSave: (court: Court) => void;
  currentSportCenter?: { id?: string; _id?: string; name?: string } | null;
}

const CourtFormModal: React.FC<CourtFormModalProps> = ({ court, onClose, onSave, currentSportCenter: centerFromProps }) => {
  const { adminCourts, createAdminCourt, updateAdminCourt, selectedCenterId } = useBookingStore();
  const { getAccessTokenSilently } = useAuth0();
  const [isSaving, setIsSaving] = useState(false);
  const [localImageFile, setLocalImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCenterId = () => {
    if (centerFromProps?.id) return centerFromProps.id;
    if (centerFromProps?._id) return centerFromProps._id;
    if (adminCourts && adminCourts.length > 0) {
      return adminCourts[0].sport_center?.id || adminCourts[0].sport_center?._id || '';
    }
    if (selectedCenterId) return selectedCenterId;
    return '';
  };

  const getCenterName = () => {
    if (centerFromProps?.name) return centerFromProps.name;
    if (adminCourts && adminCourts.length > 0) {
      return adminCourts[0].sport_center?.name || 'Sin nombre';
    }
    return 'No hay centros disponibles';
  };

  const [formData, setFormData] = useState<Court>(
    court || {
      id: Date.now().toString(),
      name: '',
      type: '',
      image: '',
      image_url: '',
      y_position: 0,
      centerId: getCenterId()
    }
  );

  const handleImageChange = (url: string, yPos?: number) => {
    setFormData({ 
      ...formData, 
      image: url, 
      image_url: url,
      y_position: yPos || 0
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    setFormData({ 
      ...formData, 
      image: '', 
      image_url: '',
      y_position: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = formData.image || formData.image_url || '';
      let yPos = formData.y_position || 0;

      if (localImageFile) {
        toast.info('Subiendo imagen a Cloudinary...');
        imageUrl = await uploadImageToCloudinary(localImageFile);
      }

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      if (court) {
        const payload = {
          name: formData.name,
          description: formData.type,
          image_url: imageUrl,
          y_position: yPos
        };
        await updateAdminCourt(court.id, payload, getAccessTokenSilently);
        onSave(formData);
        toast.success('Cancha editada exitosamente');
      } else {
        const payload = {
          sport_center_id: getCenterId(),
          name: formData.name,
          description: formData.type,
          image_url: imageUrl,
          y_position: yPos
        };

        const savedCourt = await createAdminCourt(payload, getAccessTokenSilently);

        onSave({
          ...formData,
          id: savedCourt.id || savedCourt._id,
          image: imageUrl,
          image_url: imageUrl
        });
        toast.success('Cancha creada y vinculada al centro con éxito');
      }

      setLocalImageFile(null);
      setLocalImagePreview(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Error al guardar la cancha en el servidor');
    } finally {
      setIsSaving(false);
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
          <CourtImageUpload
            value={formData.image || formData.image_url || ''}
            localPreview={localImagePreview}
            yPosition={formData.y_position}
            onUrlChange={handleImageChange}
            onFileSelect={handleFileSelect}
            onRemove={handleRemoveImage}
            hasLocalFile={!!localImageFile}
          />
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
              disabled={isSaving}
              className="flex-1 py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtFormModal;
