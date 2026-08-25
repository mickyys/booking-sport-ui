"use client";
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useMPConnect } from '@/hooks/useMPConnect';

interface MPStatusBannerProps {
  hideOnOnboarding?: boolean;
}

export const MPStatusBanner: React.FC<MPStatusBannerProps> = ({ hideOnOnboarding = false }) => {
  const { status, isLoading } = useMPConnect();
  const [pathname, setPathname] = React.useState('');

  React.useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (hideOnOnboarding && pathname.startsWith('/admin/onboarding')) {
    return null;
  }

  if (isLoading || !status || status.connected) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 p-2 rounded-lg bg-amber-100 text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <p className="text-sm font-semibold text-amber-800">
              Completa tu onboarding para recibir pagos online
            </p>
          </div>
          <Link
            href="/admin/onboarding"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all"
          >
            Configurar
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
