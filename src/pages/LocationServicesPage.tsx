import React, { useState } from 'react';
import { MapPin, Info, Car, ShowerHead, Clock, Phone, Mail } from 'lucide-react';
import { SPORT_CENTERS } from '../data/mockData';

interface LocationServicesProps {
  selectedCenter: string | null;
}

export const LocationServices: React.FC<LocationServicesProps> = ({ selectedCenter }) => {
    const [currentCenter, setCurrentCenter] = useState(selectedCenter);
    const center = SPORT_CENTERS.find(c => c.id === currentCenter) || SPORT_CENTERS[0];
    
    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">Ubicación y Servicios</h2>
            
            {/* Center Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {SPORT_CENTERS.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setCurrentCenter(c.id)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            currentCenter === c.id
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                        }`}
                    >
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {c.name}
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MapPin className="text-emerald-500" />
                        Cómo llegar
                    </h3>
                    <p className="text-slate-600 mb-4">
                        {center.address}
                    </p>
                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                            <MapPin className="w-12 h-12 mb-2 opacity-20" />
                            <span className="sr-only">Mapa de ubicación</span>
                        </div>
                        <img 
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                            alt="Mapa Referencial" 
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Info className="text-emerald-500" />
                            Servicios Incluidos
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Car className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold block text-slate-900">Estacionamiento Privado</span>
                                    <span className="text-sm text-slate-500">Gratuito para jugadores (30 cupos).</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <ShowerHead className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold block text-slate-900">Camarines y Duchas</span>
                                    <span className="text-sm text-slate-500">Agua caliente y lockers disponibles.</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold block text-slate-900">Horario Extendido</span>
                                    <span className="text-sm text-slate-500">Lunes a Domingo, 09:00 a 23:00 hrs.</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Contacto</h3>
                        <div className="space-y-3">
                            <p className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-emerald-400" />
                                <span>{center.phone}</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-emerald-400" />
                                <span>{center.email}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
