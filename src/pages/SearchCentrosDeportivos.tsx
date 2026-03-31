import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';

export default function SearchCentrosDeportivos() {
  const navigate = useNavigate();
  const { sportCenters, isLoading, fetchSportCenters } = useBookingStore();

  useEffect(() => {
    fetchSportCenters();
  }, [fetchSportCenters]);

  if (isLoading && sportCenters.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Cargando centros deportivos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
        >
          Encuentra tu lugar para <span className="text-emerald-500">jugar</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 max-w-2xl mx-auto"
        >
          Reserva canchas de fútbol y otros deportes de forma rápida y sencilla. Elige tu centro deportivo favorito y comienza a jugar.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sportCenters.map((center, index) => (
          <motion.div
            key={center.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => navigate(`/${center.slug}/reservar`)}
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={center.image}
                alt={center.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Disponible
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {center.name}
              </h3>

              <div className="flex items-center text-slate-500 mb-6">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm line-clamp-1">{center.address}</span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-1">
                  {center.services?.slice(0, 3).map((service, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                      {service}
                    </span>
                  ))}
                  {center.services?.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                      +{center.services.length - 3}
                    </span>
                  )}
                </div>
                <span className="text-emerald-500 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Reservar <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {sportCenters.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium text-lg">No se encontraron centros deportivos disponibles en este momento.</p>
        </div>
      )}
    </div>
  );
}
