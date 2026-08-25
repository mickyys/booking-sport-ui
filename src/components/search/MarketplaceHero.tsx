"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Building2, Users, Zap } from 'lucide-react';

interface MarketplaceHeroProps {
  centers: { image: string }[];
  centersCount: number;
  totalCourts: number;
  onCtaClick: () => void;
}

const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({
  centers,
  centersCount,
  totalCourts,
  onCtaClick,
}) => {
  return (
    <div className="relative min-h-[520px] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background collage */}
      <div className="absolute inset-0 grid grid-cols-3 gap-0 opacity-30">
        {centers.slice(0, 9).map((c, i) => (
          <div key={i} className="relative overflow-hidden">
            <img src={c.image} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {centers.length === 0 && (
          <div className="col-span-3 flex items-center justify-center text-slate-700">
            <Trophy className="w-16 h-16" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-6"
        >
          <Trophy className="w-4 h-4" />
          La plataforma de reservas de canchas más grande
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-white mb-5 leading-tight"
        >
          Encuentra tu cancha
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            perfecta hoy
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
        >
          Reserva en línea, paga de forma segura y juega hoy mismo.
        </motion.p>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mb-8"
        >
          {[
            { icon: <Building2 className="w-5 h-5" />, label: `${centersCount} centros deportivos` },
            { icon: <Users className="w-5 h-5" />, label: `${totalCourts} canchas disponibles` },
            { icon: <Zap className="w-5 h-5" />, label: 'Reserva instantánea' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="text-emerald-400">{icon}</span>
              {label}
            </div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCtaClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-xl shadow-emerald-500/25 transition-all"
        >
          Explorar Centros
        </motion.button>
      </div>
    </div>
  );
};

export default MarketplaceHero;