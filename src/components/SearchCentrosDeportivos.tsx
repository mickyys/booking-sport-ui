import React, { useState, useMemo } from 'react';
import { Search, MapPin, Clock, ChevronRight, Star, ShowerHead, Car, Trophy, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';

// Tipos
interface CentroDeportivo {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  imagen: string;
  rating: number;
  totalReviews: number;
  canchas: number;
  horariosDisponibles: string[];
  servicios: string[];
  precioDesde: number;
  descripcion: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
}

// Mock Data
const CENTROS_DEPORTIVOS: CentroDeportivo[] = [
  {
    id: 'golazo-las-condes',
    nombre: 'GolazoHub Las Condes',
    ciudad: 'Las Condes',
    direccion: 'Av. Apoquindo 4200, Las Condes, Santiago',
    imagen: 'https://images.unsplash.com/photo-1651043421470-88b023bb9636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NjZXIlMjBmaWVsZCUyMHN0YWRpdW0lMjBhZXJpYWx8ZW58MXx8fHwxNzc0ODk4MDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 4.8,
    totalReviews: 234,
    canchas: 4,
    horariosDisponibles: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
    servicios: ['Estacionamiento', 'Duchas', 'WiFi', 'Cafetería'],
    precioDesde: 28000,
    descripcion: 'Complejo deportivo premium con canchas de pasto sintético de última generación.',
    coordenadas: { lat: -33.4040, lng: -70.5794 }
  },
  {
    id: 'golazo-huechuraba',
    nombre: 'GolazoHub Huechuraba',
    ciudad: 'Huechuraba',
    direccion: 'Américo Vespucio 1501, Huechuraba, Santiago',
    imagen: 'https://images.unsplash.com/photo-1641352848874-c96659e03144?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvb3IlMjBmdXRzYWwlMjBjb3VydCUyMGdyZWVufGVufDF8fHx8MTc3NDg5ODA4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 4.6,
    totalReviews: 187,
    canchas: 3,
    horariosDisponibles: ['10:00', '11:00', '13:00', '14:00', '15:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
    servicios: ['Estacionamiento', 'Duchas', 'Vestuarios', 'Tienda Deportiva'],
    precioDesde: 28000,
    descripcion: 'Centro deportivo moderno con excelente ubicación y fácil acceso.',
    coordenadas: { lat: -33.3665, lng: -70.6351 }
  },
  {
    id: 'golazo-la-florida',
    nombre: 'GolazoHub La Florida',
    ciudad: 'La Florida',
    direccion: 'Vicuña Mackenna 7255, La Florida, Santiago',
    imagen: 'https://images.unsplash.com/photo-1759210720456-c9814f721479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwc29jY2VyJTIwZmllbGQlMjBuaWdodCUyMGxpZ2h0c3xlbnwxfHx8fDE3NzQ4OTgwODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 4.7,
    totalReviews: 156,
    canchas: 5,
    horariosDisponibles: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
    servicios: ['Estacionamiento', 'Duchas', 'Cafetería', 'Arriendo de Equipamiento'],
    precioDesde: 28000,
    descripcion: 'El complejo más grande de la zona sur con 5 canchas disponibles.',
    coordenadas: { lat: -33.5179, lng: -70.5885 }
  }
];

const CIUDADES = ['Todas', ...Array.from(new Set(CENTROS_DEPORTIVOS.map(c => c.ciudad)))];

const SearchCentrosDeportivos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('Todas');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Todos los horarios únicos disponibles
  const horariosUnicos = useMemo(() => {
    const horarios = new Set<string>();
    CENTROS_DEPORTIVOS.forEach(centro => {
      centro.horariosDisponibles.forEach(h => horarios.add(h));
    });
    return Array.from(horarios).sort();
  }, []);

  // Filtrado de centros
  const centrosFiltrados = useMemo(() => {
    return CENTROS_DEPORTIVOS.filter(centro => {
      const matchNombre = centro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          centro.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          centro.direccion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCiudad = ciudadSeleccionada === 'Todas' || centro.ciudad === ciudadSeleccionada;
      
      const matchHorario = !horarioSeleccionado || centro.horariosDisponibles.includes(horarioSeleccionado);

      return matchNombre && matchCiudad && matchHorario;
    });
  }, [searchTerm, ciudadSeleccionada, horarioSeleccionado]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setCiudadSeleccionada('Todas');
    setHorarioSeleccionado('');
  };

  const hayFiltrosActivos = searchTerm !== '' || ciudadSeleccionada !== 'Todas' || horarioSeleccionado !== '';

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
              <div className="flex flex-col md:flex-row gap-3">
                {/* Campo de búsqueda */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o ciudad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                  />
                </div>

                {/* Botón de filtros (móvil) */}
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="md:hidden flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-900 font-medium"
                >
                  <Filter className="w-5 h-5" />
                  Filtros
                  {hayFiltrosActivos && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  )}
                </button>

                {/* Filtros en línea (desktop) */}
                <div className="hidden md:flex gap-3">
                  <select
                    value={ciudadSeleccionada}
                    onChange={(e) => setCiudadSeleccionada(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
                  >
                    {CIUDADES.map(ciudad => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>

                  <select
                    value={horarioSeleccionado}
                    onChange={(e) => setHorarioSeleccionado(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white cursor-pointer"
                  >
                    <option value="">Todos los horarios</option>
                    {horariosUnicos.map(horario => (
                      <option key={horario} value={horario}>{horario} hrs</option>
                    ))}
                  </select>
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
                        {horariosUnicos.map(horario => (
                          <option key={horario} value={horario}>{horario} hrs</option>
                        ))}
                      </select>
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

      {/* Centros deportivos cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {centrosFiltrados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-300"
          >
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No hay resultados</h3>
            <p className="text-slate-600 mb-6">
              Intenta ajustar tus filtros de búsqueda para encontrar más opciones.
            </p>
            <button
              onClick={limpiarFiltros}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
            >
              Ver todos los centros
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centrosFiltrados.map((centro, index) => (
              <motion.div
                key={centro.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200"
              >
                {/* Imagen */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={centro.imagen}
                    alt={centro.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-slate-900">{centro.rating}</span>
                    <span className="text-xs text-slate-600">({centro.totalReviews})</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-xl font-bold text-white">{centro.nombre}</h3>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Ubicación */}
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{centro.ciudad}</p>
                      <p className="text-xs text-slate-600">{centro.direccion}</p>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {centro.descripcion}
                  </p>

                  {/* Info rápida */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{centro.canchas} canchas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{centro.horariosDisponibles.length} horarios</span>
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {centro.servicios.slice(0, 3).map((servicio, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                      >
                        {servicio === 'Estacionamiento' && <Car className="w-3 h-3" />}
                        {servicio === 'Duchas' && <ShowerHead className="w-3 h-3" />}
                        {servicio}
                      </span>
                    ))}
                    {centro.servicios.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                        +{centro.servicios.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Precio y CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Desde</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${centro.precioDesde.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <Link to={`/centro/${centro.id}`} className="no-underline">
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
        )}
      </div>

      {/* Footer info */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Por qué elegir GolazoHub?</h2>
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
              <h3 className="font-bold mb-2">Canchas Premium</h3>
              <p className="text-slate-400 text-sm">
                Instalaciones de primera calidad con pasto sintético PRO
              </p>
            </div>
            <div>
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">Cancelación Flexible</h3>
              <p className="text-slate-400 text-sm">
                Cancela hasta 3 horas antes y obtén reembolso completo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchCentrosDeportivos;
