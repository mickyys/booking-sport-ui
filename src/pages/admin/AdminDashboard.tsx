import React from 'react';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface AdminDashboardProps {
    dashboardData: any | null;
    onCancelBooking: (booking: any) => void;
    onNewBooking: () => void;
    courts: any[];
    filters: {
        page: number;
        name: string;
        date: string;
    };
    onFilterChange: (newFilters: any) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    dashboardData, 
    onCancelBooking, 
    onNewBooking,
    courts,
    filters,
    onFilterChange
    , onRefresh = () => {}
    , isRefreshing = false
}) => {
    if (!dashboardData) {
        return <div className="flex justify-center items-center h-64">Cargando dashboard...</div>;
    }

    const { todayBookingsCount, todayRevenue, totalRevenue, cancelledCount, recentBookings } = dashboardData;
    const [bookingToCancel, setBookingToCancel] = React.useState<any | null>(null);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
                <button 
                    onClick={onNewBooking}
                    className="mt-3 sm:mt-0 w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    Nueva Reserva Interna
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium">Reservas Hoy</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{todayBookingsCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium">Ingresos Totales</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">${totalRevenue.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium">Cancelaciones</span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{cancelledCount}</p>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-900">Reservas Recientes</h3>
                    
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="flex-1 sm:w-48 pl-4 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200"
                                value={filters.name}
                                onChange={(e) => onFilterChange({ name: e.target.value })}
                            />
                            {/* Date range: stored in filters.date as "from|to" */}
                            {(() => {
                                const [from, to] = (filters.date || '').split('|');
                                return (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="pl-4 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200"
                                            value={from || ''}
                                            onChange={(e) => onFilterChange({ date: `${e.target.value || ''}|${to || ''}` })}
                                        />
                                        <span className="text-slate-400">a</span>
                                        <input
                                            type="date"
                                            className="pl-4 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200"
                                            value={to || ''}
                                            onChange={(e) => onFilterChange({ date: `${from || ''}|${e.target.value || ''}` })}
                                        />
                                    </div>
                                );
                            })()}
                        </div>

                        <button
                            onClick={() => onRefresh()}
                            disabled={isRefreshing}
                            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isRefreshing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    Actualizando...
                                </span>
                            ) : (
                                'Actualizar'
                            )}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium">Cancha</th>
                                <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                                <th className="px-6 py-4 font-medium">Pago</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentBookings.map((booking: any) => (
                                <tr key={booking.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {booking.userName}
                                        {booking.isGuest && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">Invitado</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {booking.courtName || courts.find(c => c.id === booking.courtId)?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {format(parseISO(booking.date), "d MMM, HH:mm", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            booking.paymentMethod === 'mercadopago' ? 'bg-blue-100 text-blue-700' : 
                                            booking.paymentMethod === 'fintoc' ? 'bg-indigo-100 text-indigo-700' : 
                                            booking.paymentMethod === 'venue' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {booking.paymentMethod === 'mercadopago' ? 'MercadoPago' : 
                                             booking.paymentMethod === 'fintoc' ? 'Fintoc' : 
                                             booking.paymentMethod === 'venue' ? 'Presencial' : 'Interno'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            booking.status === 'confirmed'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : booking.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => setBookingToCancel(booking)}
                                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {recentBookings.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No hay reservas recientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <p className="text-xs text-slate-500 font-medium px-2">
                        {(() => {
                            const perPage = 10;
                            const total = dashboardData.totalRecentCount || 0;
                            if (total === 0) return <>Reservas: <span className="text-slate-900">0</span> de <span className="text-slate-900">0</span></>;
                            const start = (filters.page - 1) * perPage + 1;
                            return <>Reservas: <span className="text-slate-900">{start}</span> de <span className="text-slate-900">{total}</span></>;
                        })()}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={isRefreshing || filters.page <= 1}
                            onClick={() => onFilterChange({ page: filters.page - 1 })}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center"
                        >
                            {isRefreshing ? (
                                <svg className="w-3 h-3 animate-spin text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                            ) : (
                                'Anterior'
                            )}
                        </button>
                        <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg min-w-[32px] text-center">
                            {filters.page}
                        </span>
                        <button
                            disabled={isRefreshing || !dashboardData.totalRecentCount || filters.page * 10 >= dashboardData.totalRecentCount}
                            onClick={() => onFilterChange({ page: filters.page + 1 })}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center"
                        >
                            {isRefreshing ? (
                                <svg className="w-3 h-3 animate-spin text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                            ) : (
                                'Siguiente'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reserva de {bookingToCancel?.userName} para el {bookingToCancel && format(parseISO(bookingToCancel.date), "d 'de' MMMM", { locale: es })} a las {bookingToCancel?.hour}:00 será cancelada.
                            {bookingToCancel?.paymentMethod === 'flow' && (
                                <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                    Nota: Los pagos vía Flow tienen devolución del 100% garantizada.
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, mantener</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (bookingToCancel) {
                                    onCancelBooking(bookingToCancel);
                                    setBookingToCancel(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Sí, cancelar reserva
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
