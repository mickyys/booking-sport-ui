"use client";

import { Suspense } from 'react';
import { SuccessPage } from '@/components/views/booking/SuccessPage';

export default function SuccessRoute() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SuccessPage />
    </Suspense>
  );
}
