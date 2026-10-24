"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';
import { RecurringStatsCards } from './recurring/RecurringStats';
import { RecurringToolbar } from './recurring/RecurringToolbar';
import { RecurringList } from './recurring/RecurringList';
import { RecurringDetailDialog } from './recurring/RecurringDetailDialog';
import { RecurringFinishDialog } from './recurring/RecurringFinishDialog';
import {
  RecurringFilters,
  RecurringItem,
  SeriesRecurringRaw,
  WeeklyRecurringRaw,
  filterRecurring,
  getCourts,
  getRecurringStats,
  groupByDay,
  hasActiveFilters,
  normalizeRecurring,
} from './recurring/recurringUtils';

const DEFAULT_FILTERS: RecurringFilters = {
  tab: 'active',
  query: '',
  courtId: 'all',
  dayIndex: 'all',
};

export const AdminRecurringClients: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const {
    recurringReservations,
    recurringSeries,
    fetchRecurringReservationsByCenter,
    fetchRecurringSeries,
    cancelRecurringReservation,
    deleteSeries,
  } = useBookingStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<RecurringFilters>(DEFAULT_FILTERS);
  const [selectedItem, setSelectedItem] = useState<RecurringItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      fetchRecurringReservationsByCenter(getAccessTokenSilently),
      fetchRecurringSeries(getAccessTokenSilently),
    ]);
  }, [fetchRecurringReservationsByCenter, fetchRecurringSeries, getAccessTokenSilently]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const items = useMemo(
    () =>
      normalizeRecurring(
        (recurringReservations || []) as unknown as WeeklyRecurringRaw[],
        (recurringSeries || []) as unknown as SeriesRecurringRaw[],
      ),
    [recurringReservations, recurringSeries],
  );

  const stats = useMemo(() => getRecurringStats(items), [items]);
  const courts = useMemo(() => getCourts(items), [items]);
  const filteredItems = useMemo(() => filterRecurring(items, filters), [items, filters]);
  const groups = useMemo(() => groupByDay(filteredItems), [filteredItems]);

  const handleFilterChange = (patch: Partial<RecurringFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleClearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelect = (item: RecurringItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleFinishClick = (item: RecurringItem) => {
    setSelectedItem(item);
    setCancelReason('');
    setFinishOpen(true);
  };

  const handleConfirmFinish = async () => {
    if (!selectedItem || submitting) return;

    const target = selectedItem;
    setSubmitting(true);

    try {
      if (target.kind === 'weekly') {
        await cancelRecurringReservation(target.id, getAccessTokenSilently, cancelReason);
      } else {
        await deleteSeries(target.id, getAccessTokenSilently, cancelReason);
        toast.success('Serie finalizada');
      }

      await load();
      setFinishOpen(false);
      setDetailOpen(false);
      setSelectedItem(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error finishing recurring item:', error);
      if (target.kind === 'series') {
        toast.error('Error al finalizar la serie');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasFilters = hasActiveFilters(filters) || filters.tab !== 'active';

  return (
    <div className="space-y-5 pb-6 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <Repeat size={12} />
            Recurrencias
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Reservas recurrentes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Clientes con horario fijo cada semana o series con fecha de término. Gestiona su vigencia y
            contacta directamente desde el detalle.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-600 sm:w-auto"
        >
          <Plus size={16} />
          Crear en agenda
        </Link>
      </div>

      <RecurringStatsCards stats={stats} />

      <RecurringToolbar
        filters={filters}
        counts={{
          active: stats.active,
          weekly: stats.weekly,
          series: stats.series,
          finished: stats.finished,
        }}
        courts={courts}
        refreshing={refreshing}
        onChange={handleFilterChange}
        onRefresh={handleRefresh}
        onClear={handleClearFilters}
      />

      {!loading && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-semibold text-slate-400"
        >
          <span>
            Mostrando {filteredItems.length} de {items.length}{' '}
            {items.length === 1 ? 'recurrencia' : 'recurrencias'}
          </span>
          {filters.tab === 'active' && stats.finished > 0 && (
            <span>
              {stats.finished} {stats.finished === 1 ? 'finalizada' : 'finalizadas'} en el historial
            </span>
          )}
        </div>
      )}

      <RecurringList
        groups={groups}
        loading={loading}
        hasAnyItems={items.length > 0}
        hasFilters={hasFilters}
        hasFinished={stats.finished > 0}
        onSelect={handleSelect}
        onFinish={handleFinishClick}
        onClearFilters={handleClearFilters}
        onGoToAgenda={() => router.push('/admin')}
        onShowFinished={() => setFilters({ ...DEFAULT_FILTERS, tab: 'finished' })}
      />

      <RecurringDetailDialog
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onFinish={handleFinishClick}
      />

      <RecurringFinishDialog
        item={selectedItem}
        open={finishOpen}
        reason={cancelReason}
        submitting={submitting}
        onOpenChange={(open) => {
          if (!submitting) setFinishOpen(open);
        }}
        onReasonChange={setCancelReason}
        onConfirm={handleConfirmFinish}
      />
    </div>
  );
};
