import React, { useState } from 'react';
import { Calendar, DollarSign, AlertCircle, Ban, Plus, Edit, Trash2 } from 'lucide-react';
import { format, parseISO, isSameDay, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Booking, TimeSlot, Court } from '../../types';
import CourtFormModal from '../booking/CourtFormModal';

interface AdminPanelProps {
  bookings: Booking[];
  slots: TimeSlot[];
  courts: Court[];
  onCancelBooking: (booking: Booking) => void;
  onBlockSlot: (slot: TimeSlot) => void;
  onSaveCourt: (court: Court) => void;
  onDeleteCourt: (courtId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  bookings,
  slots,
  courts,
  onCancelBooking,
  onBlockSlot,
  onSaveCourt,
  onDeleteCourt
}) => {
  const [view, setView] = useState<'dashboard' | 'courts' | 'calendar'>('dashboard');
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showCourtForm, setShowCourtForm] = useState(false);
  const today = startOfToday();

  // Stats
  const todayBookings = bookings.filter(b => isSameDay(parseISO(b.date), today) && b.status === 'confirmed');
  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((acc, curr) => acc + curr.price, 0);
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  const handleSaveCourt = (court: Court) => {
    onSaveCourt(court);
    setShowCourtForm(false);
    setEditingCourt(null);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowCourtForm(true);
  };

  const handleDeleteCourt = (courtId: string) => {
    if (confirm('¿Estás seguro de eliminar esta cancha?')) {
      onDeleteCourt(courtId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Panel de Administración</h2>
          <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setView('courts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'courts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Canchas
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'calendar' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Gestionar Bloques
            </button>
          </div>
        </div>

        {view === 'dashboard' && (
          <div className="space-y-8">
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
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            booking.paymentMethod === 'mercadopago' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Webpay'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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
        )}

        {view === 'courts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Gestión de Canchas</h3>
              <button
                onClick={() => { setEditingCourt(null); setShowCourtForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Cancha
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map(court => (
                <div key={court.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <img src={court.image} alt={court.name} className="w-full h-40 object-cover" />
                  <div className="p-6">
                    <h4 className="font-bold text-lg text-slate-900 mb-1">{court.name}</h4>
                    <p className="text-sm text-slate-500 mb-4">{court.type}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCourt(court)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.slice(0, 30).map(slot => (
              <div key={slot.id} className={`p-4 rounded-xl border ${slot.status === 'available' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900">{format(slot.date, "d MMM, HH:mm")}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    slot.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {slot.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{courts.find(c => c.id === slot.courtId)?.name}</p>
                {slot.status === 'available' ? (
                  <button
                    onClick={() => onBlockSlot(slot)}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 flex justify-center items-center gap-2"
                  >
                    <Ban className="w-3 h-3" /> Bloquear
                  </button>
                ) : (
                  <button disabled className="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-sm cursor-not-allowed">
                    No disponible
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showCourtForm && (
        <CourtFormModal
          court={editingCourt}
          onClose={() => { setShowCourtForm(false); setEditingCourt(null); }}
          onSave={handleSaveCourt}
        />
      )}
    </div>
  );
};

export default AdminPanel;
