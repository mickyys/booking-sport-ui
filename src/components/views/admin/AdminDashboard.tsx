"use client";
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
} from "@/components/ui/alert-dialog";

interface AdminDashboardProps {
    dashboardData: any | null;
    onCancelBooking: (booking: any) => void;
    onNewBooking: () => void;
    courts: any[];
    filters: {
        page: number;
        name: string;
        date: string;
        code: string;
        status: string;
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

    const {
        todayBookingsCount,
        todayRevenue,
        todayOnlineRevenue,
        todayVenueRevenue,
        totalRevenue,
        totalOnlineRevenue,
        totalVenueRevenue,
        cancelledCount,
        recentBookings,
        totalRecentCount,
        limit,
        totalPages
    } = dashboardData;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Reservas Hoy</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{todayBookingsCount}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 font-medium text-sm">Ingresos Hoy</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">${todayRevenue?.toLocaleString('es-CL')}</p>
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Online</span>
                            <span className="text-blue-600">${todayOnlineRevenue?.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Presencial</span>
                            <span className="text-emerald-600">${todayVenueRevenue?.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Ingresos Totales</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">${totalRevenue?.toLocaleString('es-CL')}</p>
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Online</span>
                            <span className="text-blue-600">${totalOnlineRevenue?.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-400">Presencial</span>
                            <span className="text-emerald-600">${totalVenueRevenue?.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Cancelaciones</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{cancelledCount}</p>
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
                            <input
                                type="text"
                                placeholder="Código..."
                                className="w-24 sm:w-32 pl-4 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200"
                                value={filters.code}
                                onChange={(e) => onFilterChange({ code: e.target.value })}
                            />
                            <select
                                className="pl-4 pr-10 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat"
                                value={filters.status}
                                onChange={(e) => onFilterChange({ status: e.target.value })}
                            >
                                <option value="">Todos los estados</option>
                                <option value="confirmed">Confirmada</option>
                                <option value="pending">Pendiente</option>
                                <option value="cancelled">Cancelada</option>
                                <option value="expired">Expirada</option>
                            </select>
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
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Código</th>
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
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                                        {booking.booking_code || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {booking.customerName || booking.user_name}
                                                {booking.is_guest && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">Invitado</span>}
                                            </span>
                                            {booking.customerPhone && (
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <span className="font-bold text-slate-400">T:</span> {booking.customerPhone}
                                                </span>
                                            )}
                                            {booking.customerEmail && (
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <span className="font-bold text-slate-400">E:</span> {booking.customerEmail}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {booking.court_name || courts.find(c => c.id === booking.courtId)?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
<div>{format(parseISO(booking.date), "d MMM, HH:mm", { locale: es })}</div>
                                        {booking.isPartialPayment && (
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Abono:</span>
                                                    <span className="text-[10px] font-black text-emerald-700">${booking.paidAmount?.toLocaleString('es-CL')}</span>
                                                </div>
                                                <div className="flex justify-between w-full gap-2">
                                                    <span className="text-[10px] font-bold text-rose-500 uppercase">Pend:</span>
                                                    <span className={`text-[10px] font-black ${booking.partialPaymentPaid ? 'text-slate-400 line-through' : 'text-rose-600'}`}>
                                                        ${booking.pendingAmount?.toLocaleString('es-CL')}
                                                    </span>
                                                </div>
                                                {booking.partialPaymentPaid ? (
                                                    <span className="text-[8px] font-bold text-emerald-600 uppercase mt-0.5 bg-emerald-50 px-1 py-0.5 rounded text-center">Pagado</span>
                                                ) : (
                                                    <span className="text-[8px] font-bold text-rose-500 uppercase mt-0.5 bg-rose-50 px-1 py-0.5 rounded text-center">Pendiente</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            booking.payment_method === 'mercadopago' ? 'bg-blue-100 text-blue-700' : 
                                            booking.payment_method === 'fintoc' ? 'bg-indigo-100 text-indigo-700' : 
                                            booking.payment_method === 'venue' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {booking.payment_method === 'mercadopago' ? 'MercadoPago' : 
                                             booking.payment_method === 'fintoc' ? 'Fintoc' : 
                                             booking.payment_method === 'venue' ? 'Presencial' : 'Interno'}
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
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No hay reservas recientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                    {recentBookings.map((booking: any) => (
                        <div key={booking.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {booking.booking_code || 'N/A'}
                                    </p>
                                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                                        {booking.customerName || booking.user_name}
                                        {booking.is_guest && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">Invitado</span>}
                                    </h4>
                                    <div className="mt-1 space-y-0.5">
                                        {booking.customerPhone && (
                                            <p className="text-[10px] text-slate-500">
                                                <span className="font-bold text-slate-400">TEL:</span> {booking.customerPhone}
                                            </p>
                                        )}
                                        {booking.customerEmail && (
                                            <p className="text-[10px] text-slate-500">
                                                <span className="font-bold text-slate-400">EMAIL:</span> {booking.customerEmail}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    booking.status === 'confirmed'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : booking.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {booking.status === 'confirmed' ? 'Confirmado' : booking.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancha</p>
                                    <p className="text-xs font-medium text-slate-700">
                                        {booking.court_name || courts.find(c => c.id === booking.courtId)?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora</p>
                                    <p className="text-xs font-medium text-slate-700">
                                        {format(parseISO(booking.date), "d MMM, HH:mm", { locale: es })}
                                    </p>
                                    {booking.isPartialPayment && (
                                        <div className="mt-1 flex flex-col gap-1">
                                            <div className="flex gap-2">
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Pagado: ${booking.paidAmount?.toLocaleString('es-CL')}</span>
                                                <span className={`text-[9px] font-bold ${booking.partialPaymentPaid ? 'text-slate-400 line-through' : 'text-rose-500'} uppercase`}>
                                                    Debe: ${booking.pendingAmount?.toLocaleString('es-CL')}
                                                </span>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase self-start px-1.5 py-0.5 rounded ${booking.partialPaymentPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                {booking.partialPaymentPaid ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    booking.payment_method === 'mercadopago' ? 'bg-blue-100 text-blue-700' :
                                    booking.payment_method === 'fintoc' ? 'bg-indigo-100 text-indigo-700' :
                                    booking.payment_method === 'venue' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {booking.payment_method === 'mercadopago' ? 'MercadoPago' :
                                     booking.payment_method === 'fintoc' ? 'Fintoc' :
                                     booking.payment_method === 'venue' ? 'Presencial' : 'Interno'}
                                </span>

                                {booking.status === 'confirmed' && (
                                    <button
                                        onClick={() => setBookingToCancel(booking)}
                                        className="text-red-600 hover:text-red-800 font-bold text-[10px] border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 uppercase transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {recentBookings.length === 0 && (
                        <div className="px-6 py-12 text-center text-slate-500 text-sm">
                            No hay reservas recientes
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                    <div className="text-xs text-slate-500 font-medium px-2 text-center sm:text-left">
                        {(() => {
                            const perPage = limit || 10;
                            const total = totalRecentCount || 0;
                            const totalP = totalPages || Math.ceil(total / perPage);
                            if (total === 0) return <p>Mostrando <span className="text-slate-900 font-bold">0</span> de <span className="text-slate-900 font-bold">0</span> reservas</p>;
                            const start = (filters.page - 1) * perPage + 1;
                            const end = Math.min(filters.page * perPage, total);
                            return (
                                <div className="space-y-1">
                                    <p>Mostrando <span className="text-slate-900 font-bold">{start}-{end}</span> de <span className="text-slate-900 font-bold">{total}</span> reservas</p>
                                    <p className="text-[10px] text-slate-400">Página <span className="font-bold text-slate-600">{filters.page}</span> de <span className="font-bold text-slate-600">{totalP || 1}</span></p>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={isRefreshing || filters.page <= 1}
                            onClick={() => onFilterChange({ page: filters.page - 1 })}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center min-w-[80px]"
                        >
                            {isRefreshing ? (
                                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                            ) : (
                                'Anterior'
                            )}
                        </button>

                        {/* Page Numbers for Desktop */}
                        <div className="hidden md:flex items-center gap-1 mx-2">
                            {(() => {
                                const totalP = totalPages || Math.ceil((totalRecentCount || 0) / (limit || 10));
                                const pages = [];

                                // Simple page number logic
                                let startPage = Math.max(1, filters.page - 2);
                                let endPage = Math.min(totalP, startPage + 4);

                                if (endPage - startPage < 4) {
                                    startPage = Math.max(1, endPage - 4);
                                }

                                for (let i = startPage; i <= endPage; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => onFilterChange({ page: i })}
                                            disabled={isRefreshing}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                filters.page === i
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}
                        </div>

                        {/* Current Page for Mobile */}
                        <div className="md:hidden flex items-center justify-center w-10 h-8 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900">
                            {filters.page}
                        </div>

                        <button
                            disabled={isRefreshing || !totalRecentCount || filters.page >= (totalPages || Math.ceil(totalRecentCount / (limit || 10)))}
                            onClick={() => onFilterChange({ page: filters.page + 1 })}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center justify-center min-w-[80px]"
                        >
                            {isRefreshing ? (
                                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
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
                            Esta acción no se puede deshacer. La reserva de {bookingToCancel?.user_name} para el {bookingToCancel && format(parseISO(bookingToCancel.date), "d 'de' MMMM", { locale: es })} a las {bookingToCancel?.hour}:00 será cancelada.
                            {bookingToCancel?.payment_method === 'flow' && (
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
