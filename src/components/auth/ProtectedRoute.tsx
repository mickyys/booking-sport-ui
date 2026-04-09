"use client";
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading, isAuthenticated, isAdministrator } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
    if (!isLoading && isAuthenticated && adminOnly && !isAdministrator) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, isAdministrator, adminOnly, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdministrator) return null;

  return <>{children}</>;
};
