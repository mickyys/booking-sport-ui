import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Loader2, Search, Filter, X, Trophy, Car, ShowerHead, ChevronRight, Clock } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';

export default function SearchCentrosDeportivos() {
  const { sportCenters, isLoading, cities, fetchCities, fetchSportCenters } = useBookingStore();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Todas');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => new Date().toISOString().split('T')[0]);

  const todayISO = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    // Always fetch cities on mount
    fetchCities && fetchCities();
    // Fetch sport centers with current filters (all params optional)
    const hourParam = horarioSeleccionado ? Number(horarioSeleccionado.split(':')[0]) : undefined;
    const cityParam = ciudadSeleccionada && ciudadSeleccionada !== 'Todas' ? ciudadSeleccionada : undefined;
    fetchSportCenters && fetchSportCenters({ name: searchTerm || undefined, city: cityParam, date: fechaSeleccionada || undefined, hour: hourParam });
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    const hourParam = horarioSeleccionado ? Number(horarioSeleccionado.split(':')[0]) : undefined;
    const cityParam = ciudadSeleccionada && ciudadSeleccionada !== 'Todas' ? ciudadSeleccionada : undefined;
    fetchSportCenters && fetchSportCenters({ name: searchTerm || undefined, city: cityParam, date: fechaSeleccionada || undefined, hour: hourParam });
  }, [searchTerm, ciudadSeleccionada, horarioSeleccionado, fechaSeleccionada]);

  // Derived data
  // Normalizar datos: asegurar que `availableHours` exista para cada centro (mock vacío si no existe)
  const sportCentersNormalized = useMemo(() => {
    return sportCenters.map(c => {
      const address = (c as any).address || '';
      const addressParts = address.split(',').map((s: string) => s.trim()).filter(Boolean);
      let cityFromAddress = '';
      if (addressParts.length >= 2) cityFromAddress = addressParts[addressParts.length - 2];
      else if (addressParts.length === 1) cityFromAddress = addressParts[0];
      const formatHour = (val: any) => {
        const asNum = Number(val);
        if (!Number.isFinite(asNum)) {
          if (typeof val === 'string' && /^\d{1,2}:\d{2}$/.test(val)) return val;
          return String(val || '');
        }
        return `${String(asNum).padStart(2, '0')}:00`;
      };

      const rawHours = (c as any).availableHours ?? [];
      const normalizedHours = Array.isArray(rawHours) ? rawHours.map(formatHour).filter(Boolean) : [];

      return {
        ...c,
        city: (c as any).city ?? cityFromAddress ?? '',
        availableHours: normalizedHours,
      };
    });
  }, [sportCenters]);
  const CIUDADES = useMemo(() => {
    const fromStore = Array.isArray(cities) ? cities.map(c => (c || '').trim()).filter(Boolean) : [];
    const unique = Array.from(new Set(fromStore));
    return ['Todas', ...unique];
  }, [cities]);

  const HORARIOS = useMemo(() => {
    // Horarios fijos de 6 (6AM) a 23 (11PM) en formato HH:MM
    return Array.from({ length: 18 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`);
  }, []);

  const hayFiltrosActivos = useMemo(() => {
    return !!(ciudadSeleccionada && ciudadSeleccionada !== 'Todas') || !!horarioSeleccionado || !!searchTerm || !!fechaSeleccionada;
  }, [ciudadSeleccionada, horarioSeleccionado, searchTerm, fechaSeleccionada]);

  const limpiarFiltros = () => {
    setCiudadSeleccionada('Todas');
    setHorarioSeleccionado('');
    setSearchTerm('');
    setMostrarFiltros(false);
    setFechaSeleccionada(todayISO);
  };

  // Aplicar filtros en cliente (sin llamadas al backend)
  const centrosFiltrados = useMemo(() => {
    return sportCentersNormalized.filter(center => {
      if (ciudadSeleccionada && ciudadSeleccionada !== 'Todas' && ((center.city || '').toLowerCase() !== ciudadSeleccionada.toLowerCase())) return false;
      if (horarioSeleccionado && !(center.availableHours || []).includes(horarioSeleccionado)) return false;
      // Fecha: si el centro provee `availableDates` (ISO strings), filtrar por ella. Si no existe, no filtrar por fecha aquí.
      if (fechaSeleccionada) {
        const dates = (center as any).availableDates || (center as any).available_days || [];
        if (Array.isArray(dates) && dates.length > 0) {
          if (!dates.includes(fechaSeleccionada)) return false;
        }
      }

      if (searchTerm && !`${center.name || ''} ${center.address || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [sportCentersNormalized, ciudadSeleccionada, horarioSeleccionado, searchTerm, fechaSeleccionada]);

  if (isLoading && sportCenters.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Cargando centros deportivos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Encuentra tu <span className="text-emerald-400">Cancha Perfecta</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Busca y reserva canchas de futbolito en los mejores centros deportivos de Santiago
            </p>
          </motion.div>

          {/* Barra de búsqueda principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="flex flex-col gap-3">
                {/* Campo de búsqueda (fila superior) */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                  />
                </div>

                {/* Fila de filtros (fila inferior) */}
                <div className="flex items-center gap-3">
                  {/* Botón de filtros (móvil) */}
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="md:hidden w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-900 font-medium"
                  >
                    <Filter className="w-5 h-5" />
                    Filtros
                    {hayFiltrosActivos && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    )}
                  </button>

                  {/* Filtros en línea (desktop) */}
                      <div className="hidden md:flex gap-3 items-center justify-center w-full">
                        <select
                          value={ciudadSeleccionada}
                          onChange={(e) => setCiudadSeleccionada(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
                        >
                      {CIUDADES.map(ciudad => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>

                        <select
                          value={horarioSeleccionado}
                          onChange={(e) => setHorarioSeleccionado(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
                        >
                      <option value="">Todos los horarios</option>
                      {HORARIOS.map(horario => (
                          <option key={horario} value={horario}>{horario} hrs</option>
                        ))}
                        </select>

                        <input
                          type="date"
                          value={fechaSeleccionada}
                          min={todayISO}
                          onChange={(e) => setFechaSeleccionada(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Panel de filtros móvil */}
              <AnimatePresence>
                {mostrarFiltros && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
                      <select
                        value={ciudadSeleccionada}
                        onChange={(e) => setCiudadSeleccionada(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                      >
                        {CIUDADES.map(ciudad => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Horario disponible</label>
                      <select
                        value={horarioSeleccionado}
                        onChange={(e) => setHorarioSeleccionado(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                      >
                        <option value="">Todos los horarios</option>
                        {HORARIOS.map(horario => (
                          <option key={horario} value={horario}>{horario} hrs</option>
                        ))}
                      </select>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                        <input
                          type="date"
                          value={fechaSeleccionada}
                          min={todayISO}
                          onChange={(e) => setFechaSeleccionada(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón limpiar filtros */}
              {hayFiltrosActivos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-slate-200"
                >
                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mx-auto"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Resultados counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6"
          >
            <p className="text-slate-300">
              {centrosFiltrados.length === 0 ? (
                'No se encontraron centros deportivos'
              ) : centrosFiltrados.length === 1 ? (
                '1 centro deportivo disponible'
              ) : (
                `${centrosFiltrados.length} centros deportivos disponibles`
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centrosFiltrados.map((center, index) => (
              <motion.div
                key={center.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 flex flex-col"
              >
              {/* Imagen */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={center.image}
                  alt={center.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h3 className="text-xl font-bold text-white">{center.name}</h3>
                </div>
              </div>

              {/* Contenido */}
                <div className="p-6 flex flex-col flex-1">
                {/* Ubicación */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{center.city}</p>
                    <p className="text-xs text-slate-600">{center.address}</p>
                  </div>
                </div>

                {/* Descripción */}
                {/* <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {center.description}
                  </p> */}

                {/* Info rápida */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{center.courts} canchas</span>
                  </div>

                </div>

                {/* Servicios */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {center.services.slice(0, 3).map((service, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                    >
                      {service === 'Estacionamiento' && <Car className="w-3 h-3" />}
                      {service === 'Duchas' && <ShowerHead className="w-3 h-3" />}
                      {service}
                    </span>
                  ))}
                  {center.services.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                      +{center.services.length - 3}
                    </span>
                  )}
                </div>

                {/* Precio y CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">

                  <Link to={`/${center.slug}/reservar`} className="no-underline ml-auto">
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all group-hover:gap-3">
                      Ver más
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {sportCenters.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium text-lg">No se encontraron centros deportivos disponibles en este momento.</p>
        </div>
      )}

      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Por qué elegir en ReservaloYA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">Reserva Instantánea</h3>
              <p className="text-slate-400 text-sm">
                Confirma tu cancha en segundos y paga de forma segura
              </p>
            </div>
            <div>
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">Canchas</h3>
              <p className="text-slate-400 text-sm">
                Instalaciones de primera calidad con pasto sintético
              </p>
            </div>
            <div>
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">Notificaciones de disponibilidad</h3>
              <p className="text-slate-400 text-sm">
                Recibe un aviso cuando se libere una hora en el horario que elegiste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}
