import React from 'react';
import { Clock, Trophy, X } from 'lucide-react';

const SearchFeatures: React.FC = () => {
  return (
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
  );
};

export default SearchFeatures;
