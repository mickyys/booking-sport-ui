import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useBookingStore } from '../store/useBookingStore';

export default function CancelBookingPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const { currentBooking, isLoading, fetchBookingByCode } = useBookingStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'cancelling'>('idle');

  useEffect(() => {
    if (code) fetchBookingByCode(code);
  }, [code, fetchBookingByCode]);

  const handleCancel = async () => {
    if (!code) return;
    setStatus('cancelling');
    try {
      await api.post(`/bookings/code/${code}/cancel`);
      setStatus('success');
    } catch (err) {
      console.error('Cancel error', err);
      setStatus('error');
    }
  };

  if (isLoading && !currentBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-slate-500">Cargando reserva...</p>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Reserva no encontrada</h2>
        <p className="text-slate-500 mb-6">El código proporcionado no corresponde a ninguna reserva.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl">Ir al inicio</button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Reserva cancelada</h2>
        <p className="text-slate-500 mb-6">Tu reserva {currentBooking.booking_code} ha sido cancelada correctamente.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl">Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 bg-white rounded-3xl shadow-sm border border-slate-100 mt-8">
      <h2 className="text-2xl font-bold mb-2">Cancelar reserva</h2>
      <p className="text-slate-500 mb-6">Confirmar la cancelación de la reserva <strong>{currentBooking.booking_code}</strong> en {currentBooking.sport_center_name} - cancha {currentBooking.court_name}.</p>

      <div className="flex gap-3">
        <button onClick={handleCancel} disabled={status === 'cancelling'} className="flex-1 bg-red-600 text-white px-6 py-3 rounded-2xl">
          {status === 'cancelling' ? 'Cancelando...' : 'Confirmar cancelación'}
        </button>
        <button onClick={() => navigate(-1)} className="flex-1 border border-slate-200 px-6 py-3 rounded-2xl">Volver</button>
      </div>

      {status === 'error' && <p className="text-red-600 mt-4">No se pudo cancelar la reserva. Intenta nuevamente más tarde.</p>}
    </div>
  );
}
