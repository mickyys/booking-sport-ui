import React from 'react';
import { motion } from 'framer-motion';

interface SearchHeroProps {
  children?: React.ReactNode;
}

const SearchHero: React.FC<SearchHeroProps> = ({ children }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white pt-24 pb-3 sm:pb-3 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 md:mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Encuentra tu <span className="text-emerald-400">Cancha Perfecta</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Busca y reserva canchas en los mejores centros deportivos de tu ciudad. ¡Tu próximo partido te espera!
            </p>
          </motion.div>

          <div className="w-full max-w-3xl relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHero;
