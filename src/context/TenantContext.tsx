"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Tenant } from '@/types';
import { getTenantByHost } from '@/api/bookingApi';
import { normalizeHost, isApexHost, canonicalTenantHost } from '@/utils/host';

type TenantStatus = 'idle' | 'loading' | 'ready' | 'apex' | 'error';

interface TenantContextValue {
  tenant: Tenant | null;
  status: TenantStatus;
  host: string;
  isLoading: boolean;
  isTenantSite: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  status: 'idle',
  host: '',
  isLoading: false,
  isTenantSite: false,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [status, setStatus] = useState<TenantStatus>('idle');
  const [host, setHost] = useState('');

  const applyBranding = useCallback((t: Tenant) => {
    if (typeof document === 'undefined') return;
    const b = t.branding;
    const primary = b?.primary_color || '#10b981';
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-dark', b?.primary_dark || primary);
    root.style.setProperty('--brand-accent', b?.accent || '#6366f1');
    root.style.setProperty('--brand-nav-bg', b?.nav_bg || '#0f172a');
    root.style.setProperty('--brand-hero-gradient', b?.hero_gradient || 'linear-gradient(to bottom, rgba(15,23,42,0.5), rgba(15,23,42,0.85))');
    root.style.setProperty('--brand-primary-contrast', '#ffffff');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = normalizeHost(window.location.host || '');
    setHost(h);

    if (!h || isApexHost(h)) {
      setStatus('apex');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    getTenantByHost(canonicalTenantHost(h))
      .then((t) => {
        if (cancelled) return;
        setTenant(t);
        applyBranding(t);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [applyBranding]);

  const value = useMemo<TenantContextValue>(() => ({
    tenant,
    status,
    host,
    isLoading: status === 'loading',
    isTenantSite: status === 'ready',
  }), [tenant, status, host]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}