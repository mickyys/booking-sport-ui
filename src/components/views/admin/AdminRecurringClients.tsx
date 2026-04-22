"use client";
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Repeat, Phone, Clock, Calendar, X, Trash2, AlertTriangle, CalendarRange, RefreshCw, ChevronRight } from 'lucide-react';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/components/ui/use-mobile';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAY_NAMES: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
};

interface RecurringReservation {
    id: string;
    sport_center_id: string;
    sport_center_name?: string;
    court_id: string;
    court_name?: string;
    customer_name: string;
    customer_phone: string;
    hour: number;
    day_of_week: number;
    day_of_week_name?: string;
    price: number;
    notes?: string;
    status: 'active' | 'cancelled';
    cancelled_by?: string;
    cancel_reason?: string;
    created_at: string;
    updated_at: string;
    type: 'weekly'; // Indeterminado
}

interface RecurringSeries {
    id: string;
    customer_name: string;
    customer_phone: string;
    sport_center_id: string;
    court_id: string;
    court_name?: string;
    hour: number;
    start_date: string;
    end_date: string;
    total_bookings: number;
    confirmed_bookings: number;
    price: number;
    created_at: string;
    type: 'series'; // Con semanas definidas
    status?: 'active' | 'cancelled';
}

type CombinedItem = RecurringReservation | RecurringSeries;

export const AdminRecurringClients: React.FC = () => {
    const { getAccessTokenSilently } = useAuth0();
    const {
        selectedCenterId,
        recurringReservations,
        recurringSeries,
        fetchRecurringReservationsByCenter,
        fetchRecurringSeries,
        cancelRecurringReservation,
        deleteSeries
    } = useBookingStore();

    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'series'>('all');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchRecurringReservationsByCenter(getAccessTokenSilently),
            fetchRecurringSeries(getAccessTokenSilently)
        ]).finally(() => setLoading(false));
    }, [fetchRecurringReservationsByCenter, fetchRecurringSeries, getAccessTokenSilently]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchRecurringReservationsByCenter(getAccessTokenSilently),
                fetchRecurringSeries(getAccessTokenSilently)
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    // Combinar ambas listas
    const allItems: CombinedItem[] = [
        ...recurringReservations.map(r => ({ ...r, type: 'weekly' as const })),
        ...recurringSeries.map(s => ({ ...s, type: 'series' as const }))
    ];

    const activeWeekly = recurringReservations.filter(r => r.status === 'active');
    const activeSeries = recurringSeries;

    const filteredItems = allItems
        .filter(item => {
            if ((item as any).status === 'cancelled') return false;
            if (activeTab === 'weekly') return item.type === 'weekly';
            if (activeTab === 'series') return item.type === 'series';
            return true;
        })
        .sort((a, b) => {
            const getDayValue = (item: CombinedItem) => {
                let day;
                if (item.type === 'weekly') {
                    day = (item as RecurringReservation).day_of_week;
                } else {
                    day = parseISO((item as RecurringSeries).start_date).getDay();
                }
                // Map 0 (Sunday) to 7 to make Monday (1) the first day and Sunday the last
                return day === 0 ? 7 : day;
            };

            const dayA = getDayValue(a);
            const dayB = getDayValue(b);

            if (dayA !== dayB) {
                return dayA - dayB;
            }

            // If same day, sort by hour
            return a.hour - b.hour;
        });

    const handleViewDetail = (item: CombinedItem) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    const handleCancelClick = (item: CombinedItem) => {
        setSelectedItem(item);
        setCancelReason('');
        setShowCancelDialog(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedItem) return;

        try {
            if (selectedItem.type === 'weekly') {
                await cancelRecurringReservation(selectedItem.id, getAccessTokenSilently);
                toast.success('Reserva semanal cancelada');
            } else {
                await (deleteSeries as any)(selectedItem.id, getAccessTokenSilently);
                toast.success('Serie cancelada');
            }
            setShowCancelDialog(false);
            setSelectedItem(null);
        } catch (error) {
            toast.error('Error al cancelar');
        }
    };

    const formatHour = (hour: number, minutes?: number) => `${String(hour).padStart(2, '0')}:${String(minutes ?? 0).padStart(2, '0')}`;

    const formatPrice = (price: number | undefined | null) => {
        const validPrice = price ?? 0;
        return validPrice.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    const getItemDay = (item: CombinedItem): string => {
        if (item.type === 'weekly') {
            return DAY_NAMES[item.day_of_week] || (item as RecurringReservation).day_of_week_name || '-';
        }
        const date = parseISO((item as RecurringSeries).start_date);
        return DAY_NAMES[date.getDay()] || format(date, 'EEEE', { locale: es });
    };

    const getItemTypeBadge = (item: CombinedItem) => {
        if (item.type === 'weekly') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    <Repeat size={10} />
                    Indefinido
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <CalendarRange size={10} />
                Serie
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Reservas</h2>
                <p className="text-slate-500 mt-1">Reservas recurrentes e indefinidas de tus clientes</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{allItems.length}</p>
                            <p className="text-sm text-slate-500">Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                            <Repeat className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{activeWeekly.length}</p>
                            <p className="text-sm text-slate-500">Indefinidos</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                            <CalendarRange className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{activeSeries.length}</p>
                            <p className="text-sm text-slate-500">Series</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header with refresh button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-2 bg-white p-1 rounded-2xl border border-slate-100 w-full sm:w-fit overflow-x-auto">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    Todos ({allItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'weekly' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Repeat size={14} />
                    Semanales ({activeWeekly.length})
                </button>
                <button
                    onClick={() => setActiveTab('series')}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'series' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <CalendarRange size={14} />
                    Series ({activeSeries.length})
                </button>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* Table or Mobile Cards */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <Repeat className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-slate-900 font-bold">No hay clientes recurrentes</h4>
                        <p className="text-slate-400 text-sm mt-1">Los clientes con reservas recurrentes aparecerán aquí</p>
                    </div>
                ) : isMobile ? (
                    <div className="p-4 space-y-4">
                        {filteredItems.map((item) => (
                            <div 
                                key={`${item.type}-${item.id}`}
                                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:shadow-md transition-all space-y-4 relative overflow-hidden group"
                                onClick={() => handleViewDetail(item)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-black text-slate-900 text-lg truncate">{item.customer_name}</p>
                                            {getItemTypeBadge(item)}
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                                            <Phone size={14} className="text-slate-400" />
                                            {item.customer_phone}
                                        </p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-active:text-slate-900 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-slate-50/50 p-3 rounded-2xl space-y-1 border border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancha</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {item.type === 'weekly' ? (item as RecurringReservation).court_name : (item as RecurringSeries).court_name}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50/50 p-3 rounded-2xl space-y-1 border border-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horario</p>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                                            <Calendar size={12} className="text-emerald-500" />
                                            {getItemDay(item)} • {formatHour(item.hour, (item as any).minutes)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio p/h</p>
                                        <p className="text-xl font-black text-emerald-600">
                                            {formatPrice((item as any).price)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelClick(item);
                                        }}
                                        className="p-3 text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors border border-red-100 active:scale-95"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cancha</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Día</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{item.customer_name}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {item.customer_phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getItemTypeBadge(item)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900">
                                                {item.type === 'weekly' ? (item as RecurringReservation).court_name : (item as RecurringSeries).court_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                <Calendar size={12} />
                                                {getItemDay(item)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1 text-slate-900 font-medium">
                                                <Clock size={14} />
                                                {formatHour(item.hour, (item as any).minutes)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-emerald-600">
                                                {formatPrice((item as any).price)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetail(item)}
                                                    className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                                                >
                                                    Ver Detalle
                                                </button>
                                                <button
                                                    onClick={() => handleCancelClick(item)}
                                                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedItem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    selectedItem.type === 'weekly' ? 'bg-amber-100' : 'bg-emerald-100'
                                }`}>
                                    {selectedItem.type === 'weekly' ? (
                                        <Repeat className="w-6 h-6 text-amber-600" />
                                    ) : (
                                        <CalendarRange className="w-6 h-6 text-emerald-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {selectedItem.type === 'weekly' ? 'Reserva Semanal' : 'Serie Recurrente'}
                                    </h3>
                                    <p className="text-sm text-slate-500">Detalle del cliente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cliente</span>
                                    <span className="font-bold text-slate-900">{selectedItem.customer_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Teléfono</span>
                                    <span className="font-medium text-slate-900">{selectedItem.customer_phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cancha</span>
                                    <span className="font-medium text-slate-900">
                                        {selectedItem.type === 'weekly' 
                                            ? (selectedItem as RecurringReservation).court_name 
                                            : (selectedItem as RecurringSeries).court_name}
                                    </span>
                                </div>
                            </div>

                            <div className={`border rounded-2xl p-4 ${
                                selectedItem.type === 'weekly' 
                                    ? 'bg-amber-50 border-amber-100' 
                                    : 'bg-emerald-50 border-emerald-100'
                            }`}>
                                <div className={`flex items-center gap-2 mb-3 ${
                                    selectedItem.type === 'weekly' ? 'text-amber-700' : 'text-emerald-700'
                                }`}>
                                    {selectedItem.type === 'weekly' ? <Repeat size={16} /> : <CalendarRange size={16} />}
                                    <span className="font-bold">
                                        {selectedItem.type === 'weekly' ? 'Recurrencia Semanal' : 'Serie Recurrente'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className={selectedItem.type === 'weekly' ? 'text-amber-600' : 'text-emerald-600'}>Día</span>
                                        <span className={`font-bold ${selectedItem.type === 'weekly' ? 'text-amber-800' : 'text-emerald-800'}`}>
                                            {getItemDay(selectedItem)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className={selectedItem.type === 'weekly' ? 'text-amber-600' : 'text-emerald-600'}>Hora</span>
                                        <span className={`font-bold ${selectedItem.type === 'weekly' ? 'text-amber-800' : 'text-emerald-800'}`}>
                                            {formatHour(selectedItem.hour)}
                                        </span>
                                    </div>
                                    {selectedItem.type === 'series' && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-emerald-600">Fecha Inicio</span>
                                                <span className="font-bold text-emerald-800">
                                                    {format(parseISO((selectedItem as RecurringSeries).start_date), "d 'de' MMM", { locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-emerald-600">Reservas</span>
                                                <span className="font-bold text-emerald-800">
                                                    {(selectedItem as RecurringSeries).confirmed_bookings} / {(selectedItem as RecurringSeries).total_bookings}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Precio por hora</span>
                                <span className="text-2xl font-black text-emerald-600">
                                    {formatPrice((selectedItem as any).price)}
                                </span>
                            </div>

                            <div className="text-xs text-slate-400 text-center pt-2">
                                Creado el {format(parseISO((selectedItem as any).created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleCancelClick(selectedItem);
                                }}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent className="rounded-[2rem] border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-amber-500" />
                            ¿Cancelar {selectedItem?.type === 'weekly' ? 'reserva semanal' : 'serie'}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-base">
                            Esta acción cancelará la {selectedItem?.type === 'weekly' ? 'reserva semanal' : 'serie'} de <strong>{selectedItem?.customer_name}</strong>.
                            {selectedItem?.type === 'series' && ' Se eliminarán todas las reservas de la serie.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-bold text-slate-700 mb-2 block">Motivo de cancelación (opcional)</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ej: Cliente solicitó cancelar"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-slate-200 transition-all"
                            rows={3}
                        />
                    </div>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600">
                            Mantener
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmCancel}
                            className="rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200"
                        >
                            Cancelar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
