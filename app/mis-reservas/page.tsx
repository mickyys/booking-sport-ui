"use client";
'use client';

import ClientDashboard from '@/components/views/ClientDashboardView';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MisReservasPage() {
  return (
    <ProtectedRoute>
      <ClientDashboard />
    </ProtectedRoute>
  );
}
