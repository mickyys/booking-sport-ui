"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute superAdminOnly>
      <SuperAdminShell>{children}</SuperAdminShell>
    </ProtectedRoute>
  );
}
