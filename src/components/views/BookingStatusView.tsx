"use client";
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/store/useBookingStore';
import { SuccessPage } from './booking/SuccessPage';
import { FailurePage } from './booking/FailurePage';

export default function BookingStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Mientras el pago siga pendiente se vuelve a consultar: el backend verifica
  // el pago en Mercado Pago por booking_code y confirma la reserva si ya fue aprobado.
  useEffect(() => {
    if (!code || currentBooking?.status !== 'pending') return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (attempts > 12) {
        clearInterval(interval);
        return;
      }
      fetchBookingByCode(code).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [code, currentBooking?.status, fetchBookingByCode]);

  const mpStatus = (currentBooking as any)?.mp_status as string | undefined;
  const pendingMessage =
    mpStatus === 'in_process' || mpStatus === 'authorized'
      ? 'Mercado Pago está revisando tu pago. Te confirmaremos la reserva apenas se apruebe.'
      : mpStatus === 'rejected' || mpStatus === 'cancelled'
        ? 'Mercado Pago rechazó el pago. Puedes reintentar con otro medio de pago antes de que expire el bloque.'
        : 'Estamos esperando la confirmación de tu pago. Esto puede tardar unos segundos.';

  const showLoading = (isLoading || isInitialLoad) && !currentBooking && !isTimedOut && !hasError;

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
        onGoHome={() => router.push('/')}
        onGoToProfile={() => router.push('/mis-reservas')}
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
        <p className="text-slate-500 mb-8">{pendingMessage}</p>
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
          router.push('/reservar');
        }
      }}
      onGoHome={() => router.push('/')}
    />
  );
}
