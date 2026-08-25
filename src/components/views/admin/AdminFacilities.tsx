"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building, Waves, Trees, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import { Facility } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import FacilityFormModal from '@/components/booking/FacilityFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminFacilitiesProps {
  sportCenter?: { id?: string; _id?: string; name?: string } | null;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  quincho: { label: 'Quincho', icon: <Trees className="w-3.5 h-3.5" />, classes: 'bg-amber-100 text-amber-700' },
  sede: { label: 'Sede', icon: <Building className="w-3.5 h-3.5" />, classes: 'bg-indigo-100 text-indigo-700' },
  piscina: { label: 'Piscina', icon: <Waves className="w-3.5 h-3.5" />, classes: 'bg-sky-100 text-sky-700' },
};

export const AdminFacilities: React.FC<AdminFacilitiesProps> = ({ sportCenter }) => {
  const { getAccessTokenSilently } = useAuth0();
  const {
    adminFacilities,
    isLoading,
    fetchAdminFacilities,
    createAdminFacility,
    updateAdminFacility,
    deleteAdminFacility,
  } = useBookingStore();

  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);

  const load = useCallback(() => {
    fetchAdminFacilities(getAccessTokenSilently);
  }, [fetchAdminFacilities, getAccessTokenSilently]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (facility: Facility) => {
    try {
      const sportCenterId = sportCenter?.id || sportCenter?._id;
      if (facility.id) {
        const { id, sport_center_id, ...data } = facility;
        await updateAdminFacility(id, data, getAccessTokenSilently);
        toast.success('Facility actualizada');
      } else {
        await createAdminFacility({ ...facility, sport_center_id: sportCenterId }, getAccessTokenSilently);
        toast.success('Facility creada');
      }
      setShowForm(false);
      setEditingFacility(null);
      load();
    } catch (error) {
      console.error('Error saving facility:', error);
      toast.error('Error al guardar la facility');
    }
  };

  const confirmDelete = async () => {
    if (!facilityToDelete) return;
    try {
      await deleteAdminFacility(facilityToDelete.id, getAccessTokenSilently);
      toast.success('Facility eliminada');
      setIsDeleteDialogOpen(false);
      setFacilityToDelete(null);
      load();
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast.error('Error al eliminar la facility');
    }
  };

  const priceLabel = (f: Facility) => {
    if (f.type === 'quincho') {
      return f.price_all_day ? `Desde $${f.price_all_day.toLocaleString('es-CL')}/día` : 'Sin precio';
    }
    return f.price_per_day ? `Desde $${f.price_per_day.toLocaleString('es-CL')}/día` : 'Sin precio';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Gestión de Facilities</h3>
          <p className="text-sm text-slate-500 mt-0.5">Quinchos, sedes y piscinas arrendables</p>
        </div>
        <button
          onClick={() => { setEditingFacility(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Facility
        </button>
      </div>

      {isLoading && adminFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          Cargando facilities...
        </div>
      ) : adminFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 mb-2">No hay facilities configuradas.</p>
          <p className="text-sm text-slate-400">
            Agrega quinchos, sedes o piscinas para que aparezcan en la página pública de tu centro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFacilities.map((f: Facility) => {
            const meta = TYPE_META[f.type] || TYPE_META.quincho;
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {f.image_url || f.image ? (
                  <img src={f.image_url || f.image} alt={f.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-300">
                    {meta.icon}
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-lg text-slate-900">{f.name}</h4>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.classes}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{f.description || 'Sin descripción'}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {f.capacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {priceLabel(f)}
                    </span>
                    {f.area && <span>{f.area}</span>}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => { setEditingFacility(f); setShowForm(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => { setFacilityToDelete(f); setIsDeleteDialogOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <FacilityFormModal
          facility={editingFacility}
          onClose={() => { setShowForm(false); setEditingFacility(null); }}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white rounded-2xl border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              ¿Confirmar eliminación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Se eliminará la facility <strong>{facilityToDelete?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFacilities;