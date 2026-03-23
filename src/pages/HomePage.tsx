import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin } from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';

// Keep the old Hero export for backward compatibility (used in App.tsx)
export { Hero } from './HomePage.legacy';

export default function HomePage() {
  const navigate = useNavigate();
  const { sportCenters, courts, selectedCenterId, setSelectedCenterId } = useBookingStore();

  return (
    <>
      {/* Hero */}
      <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={sportCenters.find(c => c.id === selectedCenterId)?.image || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000"}
            alt="Cancha de futbolito"
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg"
          >
            Canchas disponibles <br /><span className="text-emerald-400">en {sportCenters.length} Ubicaciones</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto"
          >
            Encuentra, reserva y juega. Elige el horario que más te acomode y paga según disponibilidad.
          </motion.p>

          {/* Center Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {sportCenters.map(center => (
              <button
                key={center.id}
                onClick={() => setSelectedCenterId(center.id)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${selectedCenterId === center.id
                    ? 'bg-emerald-500 text-white shadow-lg scale-105'
                    : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                  }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                {center.location}
              </button>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/reservar')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 mx-auto"
          >
            <Calendar className="w-5 h-5" />
            Ver Disponibilidad
          </motion.button>
        </div>
      </div>

      {/* Courts section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Nuestras Canchas en {sportCenters.find(c => c.id === selectedCenterId)?.location || 'Cargando...'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {courts.filter(court => court.centerId === selectedCenterId).map((court) => (
              <div key={court.id} className="group cursor-pointer p-4 rounded-3xl hover:bg-slate-50 transition-colors" onClick={() => navigate('/reservar')}>
                <div className="relative h-48 mb-6 overflow-hidden rounded-2xl">
                  <img src={court.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={court.name} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Disponible
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">{court.name}</h3>
                <p className="text-slate-500">{court.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Keep legacy named export so old App.tsx doesn't break during transition
export const Hero = ({ onCtaClick, selectedCenter, onCenterChange, sportCenters }: any) => {
  return null; // Will be removed once App.tsx is fully migrated
};
