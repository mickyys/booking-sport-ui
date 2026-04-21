"use client";

import { Suspense } from 'react';
import BookingStatusPage from '@/components/views/BookingStatusView';

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-slate-500">Cargando...</p>
      </div>
    }>
      <BookingStatusPage />
    </Suspense>
  );
}
