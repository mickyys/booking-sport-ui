"use client";
"use client";
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBookingStore } from '@/store/useBookingStore';
import { SuccessPage } from './booking/SuccessPage';
import { FailurePage } from './booking/FailurePage';

export default function BookingStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const { currentBooking, isLoading, fetchBookingByCode, resetCurrentBooking } = useBookingStore();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    resetCurrentBooking();
    setIsInitialLoad(true);
    setHasError(false);
    setIsTimedOut(false);

    if (code) {
      fetchBookingByCode(code)
        .then(() => {
          setIsInitialLoad(false);
        })
        .catch(() => {
          setHasError(true);
          setIsInitialLoad(false);
        });
    } else {
      setIsInitialLoad(false);
    }

    const timer = setTimeout(() => {
      setIsTimedOut(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [code, fetchBookingByCode, resetCurrentBooking]);

  const showLoading = (isLoading || isInitialLoad) && !isTimedOut && !hasError;

  if (showLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-slate-500">Verificando estado de tu reserva...</p>
      </div>
    );
  }

  if (currentBooking?.status === 'confirmed') {
    return (
      <SuccessPage
        onGoHome={() => navigate('/')}
        onGoToProfile={() => navigate('/mis-reservas')}
      />
    );
  }

  if (currentBooking?.status === 'pending') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center bg-white rounded-3xl shadow-sm border border-slate-100 mt-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent animate-spin rounded-full" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Pago en proceso</h2>
        <p className="text-slate-500 mb-8">Estamos esperando la confirmación de tu pago. Esto puede tardar unos segundos.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors w-full"
        >
          Actualizar Estado
        </button>
      </div>
    );
  }

  return (
    <FailurePage
      onRetry={() => {
        if (code) {
          resetCurrentBooking();
          setIsInitialLoad(true);
          setHasError(false);
          setIsTimedOut(false);
          fetchBookingByCode(code)
            .then(() => setIsInitialLoad(false))
            .catch(() => {
              setHasError(true);
              setIsInitialLoad(false);
            });
        } else {
          navigate('/reservar');
        }
      }}
      onGoHome={() => navigate('/')}
    />
  );
}
