"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminPanel } from '@/components/views/AdminPanel';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute adminOnly>
      <AdminPanel>
        {children}
      </AdminPanel>
    </ProtectedRoute>
  );
}
