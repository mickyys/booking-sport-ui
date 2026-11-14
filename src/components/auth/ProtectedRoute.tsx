"use client";
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isLoading, isAuthenticated, isAdministrator, isSuperAdmin, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Evita disparar varios redirects/login mientras el estado de auth cambia.
  const redirectingRef = React.useRef(false);

  React.useEffect(() => {
    if (isLoading || redirectingRef.current) return;

    if (!isAuthenticated) {
      // Sin sesión (o sesión expirada): autenticarse y volver a esta ruta.
      // Antes se enviaba a '/' y se perdía el destino original.
      redirectingRef.current = true;
      login({ appState: { returnTo: pathname } });
      return;
    }

    if (superAdminOnly && !isSuperAdmin) {
      redirectingRef.current = true;
      router.push('/');
      return;
    }

    if (adminOnly && !isAdministrator) {
      redirectingRef.current = true;
      router.push('/');
    }
  }, [isLoading, isAuthenticated, isAdministrator, isSuperAdmin, adminOnly, superAdminOnly, router, pathname, login]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (superAdminOnly && !isSuperAdmin) return null;
  if (adminOnly && !isAdministrator) return null;

  return <>{children}</>;
};
