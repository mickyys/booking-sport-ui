import React from 'react';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format, parseISO, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking } from '../../types';

interface AdminDashboardProps {
    bookings: Booking[];
    onCancelBooking: (booking: Booking) => void;
    onNewBooking: () => void;
    // We use any[] for courts as it was not typed in the original file
    courts: any[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    bookings, 
    onCancelBooking, 
    onNewBooking,
    courts 
}) => {
    const today = startOfToday();
    const todayBookings = bookings.filter(b => isSameDay(parseISO(b.date), today) && b.status === 'confirmed');
    const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((acc, curr) => acc + (curr.price || 0), 0);
    const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
                <button 
                    onClick={onNewBooking}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    + Nueva Reserva Interna
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
                    <p className="text-4xl font-bold text-slate-900">{todayBookings.length}</p>
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
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Últimas Reservas</h3>
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
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {booking.userName}
                                        {booking.isGuest && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">Invitado</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {courts.find(c => c.id === booking.courtId)?.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {format(parseISO(booking.date), "d MMM, HH:mm", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${booking.paymentMethod === 'mercadopago' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {booking.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Webpay'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {booking.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {booking.status === 'confirmed' && (
                                            <button
                                                onClick={() => onCancelBooking(booking)}
                                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
