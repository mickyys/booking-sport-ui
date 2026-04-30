"use client";

import { Suspense } from 'react';
import { FailurePage } from '@/components/views/booking/FailurePage';

export default function FailureRoute() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FailurePage 
        onGoHome={() => window.location.href = '/'}
      />
    </Suspense>
  );
}