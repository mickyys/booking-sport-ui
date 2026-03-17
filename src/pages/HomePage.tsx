import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin } from 'lucide-react';
import { SportCenter } from '../types';

interface HeroProps {
  onCtaClick: () => void;
  selectedCenter: string | null;
  onCenterChange: (centerId: string) => void;
  sportCenters: SportCenter[];
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick, selectedCenter, onCenterChange, sportCenters }) => (
  <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img 
        src={sportCenters.find(c => c.id === selectedCenter)?.image || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000"}
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
        Canchas Profesionales <br/><span className="text-emerald-400">en {sportCenters.length} Ubicaciones</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto"
      >
        Horario extendido. Tarifas especiales según el horario. Reserva como invitado o regístrate para beneficios exclusivos.
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
            onClick={() => onCenterChange(center.id)}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              selectedCenter === center.id
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
        onClick={onCtaClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 mx-auto"
      >
        <Calendar className="w-5 h-5" />
        Ver Disponibilidad
      </motion.button>
    </div>
  </div>
);
