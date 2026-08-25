"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Building, Waves, Trees, Trophy, Users, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import { Space, SpaceCategory } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import SpaceFormModal from '@/components/booking/SpaceFormModal';
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

interface AdminSpacesProps {
  sportCenter?: { id?: string; _id?: string; name?: string } | null;
}

const CATEGORY_META: Record<SpaceCategory, { label: string; icon: React.ReactNode; classes: string }> = {
  cancha: { label: 'Cancha', icon: <Trophy className="w-3.5 h-3.5" />, classes: 'bg-emerald-100 text-emerald-700' },
  quincho: { label: 'Quincho', icon: <Trees className="w-3.5 h-3.5" />, classes: 'bg-amber-100 text-amber-700' },
  sede: { label: 'Sede', icon: <Building className="w-3.5 h-3.5" />, classes: 'bg-indigo-100 text-indigo-700' },
  piscina: { label: 'Piscina', icon: <Waves className="w-3.5 h-3.5" />, classes: 'bg-sky-100 text-sky-700' },
};

const CATEGORY_ORDER: SpaceCategory[] = ['cancha', 'quincho', 'sede', 'piscina'];

type FilterValue = 'all' | SpaceCategory;

export const AdminSpaces: React.FC<AdminSpacesProps> = ({ sportCenter }) => {
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const {
    adminSpaces,
    isLoading,
    fetchAdminSpaces,
    createAdminSpace,
    updateAdminSpace,
    deleteAdminSpace,
  } = useBookingStore();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);

  const load = useCallback(() => {
    fetchAdminSpaces(getAccessTokenSilently);
  }, [fetchAdminSpaces, getAccessTokenSilently]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSpaces = React.useMemo(() => {
    if (filter === 'all') return adminSpaces || [];
    return (adminSpaces || []).filter((s: Space) => s.category === filter);
  }, [adminSpaces, filter]);

  const handleSave = async (space: Space) => {
    try {
      const sportCenterId = sportCenter?.id || sportCenter?._id;
      if (space.id) {
        const { id, sport_center_id, ...data } = space;
        await updateAdminSpace(id, data, getAccessTokenSilently);
        toast.success('Espacio actualizado');
      } else {
        await createAdminSpace({ ...space, sport_center_id: sportCenterId }, getAccessTokenSilently);
        toast.success('Espacio creado');
      }
      setShowForm(false);
      setEditingSpace(null);
      load();
    } catch (error) {
      console.error('Error saving space:', error);
      toast.error('Error al guardar el espacio');
    }
  };

  const confirmDelete = async () => {
    if (!spaceToDelete) return;
    try {
      await deleteAdminSpace(spaceToDelete.id, getAccessTokenSilently);
      toast.success('Espacio eliminado');
      setIsDeleteDialogOpen(false);
      setSpaceToDelete(null);
      load();
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error('Error al eliminar el espacio');
    }
  };

  const priceLabel = (s: Space) => {
    if (s.category === 'quincho') {
      return s.price_all_day ? `Desde $${s.price_all_day.toLocaleString('es-CL')}/día` : 'Sin precio';
    }
    if (s.category === 'sede' || s.category === 'piscina') {
      return s.price_per_day ? `Desde $${s.price_per_day.toLocaleString('es-CL')}/día` : 'Sin precio';
    }
    return s.description || '';
  };

  const countByCategory = (c: SpaceCategory) => (adminSpaces || []).filter((s: Space) => s.category === c).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Gestión de Espacios</h3>
          <p className="text-sm text-slate-500 mt-0.5">Canchas, quinchos, sedes y piscinas del centro deportivo</p>
        </div>
        <button
          onClick={() => { setEditingSpace(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Espacio
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          Todos ({adminSpaces?.length || 0})
        </button>
        {CATEGORY_ORDER.map((c) => {
          const meta = CATEGORY_META[c];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                filter === c
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {meta.icon}
              {meta.label} ({countByCategory(c)})
            </button>
          );
        })}
      </div>

      {isLoading && adminSpaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          Cargando espacios...
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 mb-2">No hay espacios en esta categoría.</p>
          <p className="text-sm text-slate-400">
            Agrega canchas, quinchos, sedes o piscinas para que aparezcan en la página pública de tu centro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((s: Space) => {
            const meta = CATEGORY_META[s.category] || CATEGORY_META.cancha;
            const isFacility = s.category !== 'cancha';
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {s.image_url || s.image ? (
                  <img src={s.image_url || s.image} alt={s.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-300">
                    {meta.icon}
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-lg text-slate-900">{s.name}</h4>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.classes}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{s.description || 'Sin descripción'}</p>
                  {isFacility && (
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {s.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> {priceLabel(s)}
                      </span>
                      {s.area && <span>{s.area}</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto flex-wrap">
                    <button
                      onClick={() => router.push(`/admin/spaces/${s.id}/schedule`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      Horarios
                    </button>
                    <button
                      onClick={() => { setEditingSpace(s); setShowForm(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => { setSpaceToDelete(s); setIsDeleteDialogOpen(true); }}
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
        <SpaceFormModal
          space={editingSpace}
          onClose={() => { setShowForm(false); setEditingSpace(null); }}
          onSave={handleSave}
          currentSportCenter={sportCenter}
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
              Se eliminará el espacio <strong>{spaceToDelete?.name}</strong>. Esta acción no se puede deshacer.
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

export default AdminSpaces;