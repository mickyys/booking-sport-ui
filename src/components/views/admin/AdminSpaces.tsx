"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Trash2,
  Trees,
  Trophy,
  Users,
  Waves,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import { Space, SpaceCategory, ScheduleSource } from '@/types';
import { useBookingStore } from '@/store/useBookingStore';
import { getSpaceSchedule } from '@/api/bookingApi';
import { facilityPriceSummary } from '@/utils/schedule';
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

const SOURCE_BADGE: Record<ScheduleSource, { label: string; classes: string }> = {
  rules: { label: 'Configurado', classes: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  legacy: { label: 'Revisar', classes: 'border-amber-200 bg-amber-50 text-amber-700' },
  none: { label: 'Sin horario', classes: 'border-slate-200 bg-slate-50 text-slate-500' },
};

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
  const [query, setQuery] = useState('');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [sources, setSources] = useState<Record<string, ScheduleSource>>({});
  const loadedRef = useRef<Set<string>>(new Set());

  const spaces = useMemo(
    () => ((adminSpaces || []) as Space[]).map((space: any) => ({
      ...space,
      id: space.id || space._id,
      category: (space.category || 'cancha') as SpaceCategory,
    })),
    [adminSpaces],
  );

  const load = useCallback(() => {
    fetchAdminSpaces(getAccessTokenSilently);
  }, [fetchAdminSpaces, getAccessTokenSilently]);

  useEffect(() => {
    load();
  }, [load]);

  // Estado de configuración por espacio (una sola carga por sesión de pantalla).
  useEffect(() => {
    const missing = spaces.filter((space) => !loadedRef.current.has(space.id));
    if (missing.length === 0) return;
    missing.forEach((space) => loadedRef.current.add(space.id));

    let cancelled = false;
    const loadSources = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
            scope: 'openid profile email',
          },
        });
        const results: PromiseSettledResult<{ id: string; source: ScheduleSource }>[] = [];
        // Limita la concurrencia para no saturar la red en mobile o centros con
        // muchos espacios.
        for (let index = 0; index < missing.length; index += 5) {
          const chunk = missing.slice(index, index + 5);
          const chunkResults = await Promise.allSettled(
            chunk.map((space) => getSpaceSchedule(space.id, token).then((data) => ({
              id: space.id,
              source: data.source,
            }))),
          );
          results.push(...chunkResults);
        }
        if (cancelled) return;
        setSources((prev) => {
          const next = { ...prev };
          results.forEach((result) => {
            if (result.status === 'fulfilled') next[result.value.id] = result.value.source;
          });
          return next;
        });
      } catch (error) {
        console.error('Error loading schedule sources:', error);
      }
    };
    loadSources();

    return () => {
      cancelled = true;
    };
  }, [spaces, getAccessTokenSilently]);

  const filteredSpaces = useMemo(() => {
    const term = query.trim().toLowerCase();
    return spaces
      .filter((space) => filter === 'all' || space.category === filter)
      .filter((space) => !term || (space.name || '').toLowerCase().includes(term))
      .sort((a, b) => {
        const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return (a.name || '').localeCompare(b.name || '', 'es');
      });
  }, [spaces, filter, query]);

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

  const countByCategory = (category: SpaceCategory) => spaces.filter((space) => space.category === category).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Espacios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Canchas, quinchos, sedes y piscinas. Configura horarios, tarifas y disponibilidad.
          </p>
        </div>
        <button
          onClick={() => { setEditingSpace(null); setShowForm(true); }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-600 sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo espacio
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-colors ${
              filter === 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <LayoutGrid size={14} /> Todas ({spaces.length})
          </button>
          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-colors ${
                  filter === category
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {meta.icon}
                {meta.label} ({countByCategory(category)})
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar espacio..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      {isLoading && spaces.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Cargando espacios...
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
          <p className="text-sm font-bold text-slate-700">
            {spaces.length === 0 ? 'Todavía no hay espacios' : 'No encontramos espacios'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {spaces.length === 0
              ? 'Agrega canchas, quinchos, sedes o piscinas para que aparezcan en la página pública de tu centro.'
              : 'Prueba con otro nombre o cambia la categoría.'}
          </p>
          {spaces.length === 0 ? (
            <button
              onClick={() => { setEditingSpace(null); setShowForm(true); }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
            >
              <Plus size={16} /> Crear espacio
            </button>
          ) : (
            <button
              onClick={() => { setQuery(''); setFilter('all'); }}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {filteredSpaces.map((space) => {
            const meta = CATEGORY_META[(space.category || 'cancha') as SpaceCategory] || CATEGORY_META.cancha;
            const isFacility = space.category !== 'cancha';
            const source = sources[space.id];
            const badge = source ? SOURCE_BADGE[source] : null;
            const price = isFacility ? facilityPriceSummary(space) : null;

            return (
              <article
                key={space.id}
                onClick={() => router.push(`/admin/spaces/${space.id}`)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="relative">
                  {space.image_url || space.image ? (
                    <img
                      src={space.image_url || space.image}
                      alt={space.name}
                      loading="lazy"
                      className="h-36 w-full object-cover sm:h-40"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-300 sm:h-40">
                      {meta.icon}
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-sm ${meta.classes}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                  {badge && (
                    <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shadow-sm ${badge.classes}`}>
                      {source === 'legacy' && <AlertTriangle size={10} />}
                      {badge.label}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 truncate text-lg font-black tracking-tight text-slate-900">{space.name}</h2>
                    <ChevronRight size={18} className="mt-0.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{space.description || 'Sin descripción'}</p>

                  {(isFacility || price) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {isFacility && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {space.capacity || 'Sin capacidad'}
                        </span>
                      )}
                      {price && (
                        <span className="flex min-w-0 items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{price}</span>
                        </span>
                      )}
                      {isFacility && space.area && <span className="truncate">{space.area}</span>}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(`/admin/spaces/${space.id}`);
                      }}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                    >
                      <Clock className="w-4 h-4" /> Gestionar
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingSpace(space);
                        setShowForm(true);
                      }}
                      aria-label={`Editar ${space.name}`}
                      title="Editar información"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSpaceToDelete(space);
                        setIsDeleteDialogOpen(true);
                      }}
                      aria-label={`Eliminar ${space.name}`}
                      title="Eliminar espacio"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
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
