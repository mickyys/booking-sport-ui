"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { AdminSpaceSchedule } from '@/components/views/admin/AdminSpaceSchedule';

export default function SpaceSchedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getAccessTokenSilently } = useAuth0();
  const { currentSportCenter } = useAdminPanel();
  const adminSpaces = useBookingStore(s => s.adminSpaces);
  const fetchAdminSpaces = useBookingStore(s => s.fetchAdminSpaces);

  const space = adminSpaces.find(s => s.id === params.id);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchAdminSpaces(getAccessTokenSilently).finally(() => setLoaded(true));
    }
  }, [loaded, fetchAdminSpaces, getAccessTokenSilently]);

  if (!space) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        {loaded ? 'No se encontró el espacio.' : 'Cargando espacio...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/spaces')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a Espacios
      </button>
      <AdminSpaceSchedule
        spaceId={space.id}
        spaceName={space.name}
        category={space.category}
        paymentMode={(currentSportCenter as any)?.payment_mode}
      />
    </div>
  );
}
