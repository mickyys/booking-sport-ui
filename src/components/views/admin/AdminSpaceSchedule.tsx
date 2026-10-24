"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ScheduleRule, ScheduleSource, Space, SpaceCategory } from '@/types';
import { getSpaceSchedule } from '@/api/bookingApi';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { SpaceSchedulePanel } from './schedules/SpaceSchedulePanel';

interface AdminSpaceScheduleProps {
  spaceId: string;
  spaceName?: string;
  category?: string;
}

export const AdminSpaceSchedule: React.FC<AdminSpaceScheduleProps> = ({
  spaceId,
  spaceName,
  category,
}) => {
  const { getAccessTokenSilently } = useAuth0();
  const { spaces: rawSpaces, currentSportCenter } = useAdminPanel();

  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [source, setSource] = useState<ScheduleSource>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getToken = useCallback(
    () => getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
    }),
    [getAccessTokenSilently],
  );

  const allSpaces = useMemo(
    () => ((rawSpaces || []) as Space[]).map((space: any) => ({
      ...space,
      id: space.id || space._id,
      category: (space.category || 'cancha') as SpaceCategory,
    })),
    [rawSpaces],
  );

  const space = useMemo<Space>(() => {
    const found = allSpaces.find((item) => item.id === spaceId);
    if (found) return found;
    return {
      id: spaceId,
      name: spaceName || 'Espacio',
      description: '',
      category: (category || 'cancha') as SpaceCategory,
    };
  }, [allSpaces, spaceId, spaceName, category]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await getToken();
      const data = await getSpaceSchedule(spaceId, token);
      setRules(data.rules);
      setSource(data.source);
    } catch (err) {
      console.error('Error loading space schedule:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getToken, spaceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm font-semibold text-slate-500">
        <Loader2 size={18} className="animate-spin" /> Cargando configuración de horarios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-black text-slate-700">No se pudo cargar la configuración de horarios</p>
        <p className="mt-1 text-xs text-slate-400">Revisa tu conexión e inténtalo nuevamente.</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
        >
          <RefreshCw size={15} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <SpaceSchedulePanel
      key={spaceId}
      space={space}
      initialRules={rules}
      initialSource={source}
      allSpaces={allSpaces}
      paymentMode={currentSportCenter?.payment_mode ?? ''}
      partialPercent={currentSportCenter?.partialPaymentPercent ?? currentSportCenter?.partial_payment_percent ?? 50}
      partialEnabled={currentSportCenter?.partialPaymentEnabled ?? currentSportCenter?.partial_payment_enabled ?? false}
      onSaved={(_, nextRules, nextSource) => {
        setRules(nextRules);
        setSource(nextSource);
      }}
      variant="page"
    />
  );
};

export default AdminSpaceSchedule;
