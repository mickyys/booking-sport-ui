import React, { useEffect, useState } from 'react';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { 
    Users, 
    Calendar, 
    Trash2, 
    Clock, 
    Search, 
    ChevronRight, 
    AlertCircle,
    User as UserIcon,
    Phone,
    MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export const AdminSubscriptions: React.FC = () => {
    const { getAccessTokenSilently } = useAuth0();
    const { 
        recurringSeries, 
        fetchRecurringSeries, 
        deleteSeries,
        isLoading 
    } = useBookingStore();
    
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRecurringSeries(getAccessTokenSilently);
    }, [fetchRecurringSeries, getAccessTokenSilently]);

    const handleDeleteSeries = async (seriesId: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente TODA la serie de reservas de ${name}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await deleteSeries(seriesId, getAccessTokenSilently);
            toast.success("Suscripción eliminada con éxito");
            fetchRecurringSeries(getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al eliminar la suscripción");
        }
    };

    const filteredSeries = recurringSeries.filter(s => 
        s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.court_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Clientes Recurrentes</h2>
                    <p className="text-slate-500 mt-1">Gestiona las suscripciones y arriendos masivos de larga duración.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                    <Users size={20} />
                    <span className="font-bold">{recurringSeries.length} Suscripciones</span>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o cancha..."
                        className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Suscripciones */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Cargando suscripciones...</p>
                </div>
            ) : filteredSeries.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredSeries.map((series) => (
                        <div 
                            key={series.series_id}
                            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden group"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 truncate max-w-[200px]">
                                                {series.customer_name}
                                            </h4>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5">
                                                <Phone size={14} />
                                                <span>{series.customer_phone || 'Sin teléfono'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSeries(series.series_id, series.customer_name)}
                                        className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-300"
                                        title="Eliminar toda la serie"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cancha</p>
                                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                                            <MapPin size={16} className="text-emerald-500" />
                                            <span>{series.court_name}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Horario</p>
                                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                                            <Clock size={16} className="text-emerald-500" />
                                            <span>{series.hour}:00 hrs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Próximos Arriendos</p>
                                            <p className="text-sm font-bold text-emerald-900">
                                                {series.bookings_count} sesiones pendientes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1">Termina el</p>
                                        <p className="text-sm font-black text-emerald-900">
                                            {format(new Date(series.end_date), "d 'de' MMM, yyyy", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Users size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No hay clientes recurrentes</h3>
                    <p className="text-slate-500 mt-2 max-w-xs">
                        Las reservas que realices como "recurrentes" en el calendario aparecerán aquí automáticamente.
                    </p>
                </div>
            )}
        </div>
    );
};