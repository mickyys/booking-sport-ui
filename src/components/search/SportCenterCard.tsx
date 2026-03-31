import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Trophy, Car, ShowerHead, ChevronRight } from 'lucide-react';
import { SportCenter } from '../../types';

interface SportCenterCardProps {
  center: SportCenter;
  index: number;
}

const SportCenterCard: React.FC<SportCenterCardProps> = ({ center, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 flex flex-col"
    >
      {/* Image */}
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

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Location */}
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900">{center.address.split(',').pop()?.trim() || center.location}</p>
            <p className="text-xs text-slate-600">{center.address}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{center.courts} canchas</span>
          </div>
        </div>

        {/* Services */}
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

        {/* Price and CTA */}
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
  );
};

export default SportCenterCard;
