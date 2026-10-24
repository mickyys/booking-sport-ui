"use client";

import React from 'react';
import { ArrowRight, ChevronRight, Repeat } from 'lucide-react';
import {
  RecurringGroup,
  RecurringItem,
  formatCLP,
  formatHour,
  formatRelativeDay,
  formatShortDate,
  getInitials,
  getKindLabel,
} from './recurringUtils';

interface RecurringListProps {
  groups: RecurringGroup[];
  loading: boolean;
  hasAnyItems: boolean;
  hasFilters: boolean;
  hasFinished: boolean;
  onSelect: (item: RecurringItem) => void;
  onClearFilters: () => void;
  onGoToAgenda: () => void;
  onShowFinished: () => void;
}

const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_4rem_minmax(0,1.3fr)_6rem_7.5rem_1rem] md:items-center md:gap-3';

const badgeClass = (item: RecurringItem): string => {
  if (item.isFinished) return 'bg-slate-100 text-slate-500';
  if (item.kind === 'weekly') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

const dateLabel = (item: RecurringItem): string => {
  if (item.isFinished) return `Finalizada ${formatShortDate(item.finishedAt)}`;
  if (item.nextDate) return formatRelativeDay(item.nextDate);
  return 'Sin próximas fechas';
};

const Badge: React.FC<{ item: RecurringItem }> = ({ item }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass(item)}`}
  >
    {getKindLabel(item)}
  </span>
);

const RecurringRow: React.FC<{
  item: RecurringItem;
  onSelect: (item: RecurringItem) => void;
}> = ({ item, onSelect }) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`Ver detalle de ${item.customerName}`}
      className={`group flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/60 sm:px-4 ${ROW_GRID}`}
    >
      {/* Mobile: 2 líneas. Desktop: columnas. */}
      <span className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${badgeClass(item)}`}
          aria-hidden="true"
        >
          {getInitials(item.customerName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2 md:block">
            <span className="block truncate text-[15px] font-black text-slate-900">
              {item.customerName}
            </span>
            <span className="shrink-0 text-sm font-black text-slate-900 md:hidden">
              {formatHour(item.hour, item.minutes)}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 md:hidden">
            <span className="truncate">{item.courtName}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{dateLabel(item)}</span>
          </span>
          <span className="hidden truncate text-xs font-medium text-slate-500 md:block">
            {item.customerPhone || 'Sin teléfono'}
          </span>
        </span>
      </span>

      <span className="hidden truncate text-sm font-semibold text-slate-700 md:block">
        {item.courtName}
      </span>
      <span className="hidden text-sm font-black text-slate-900 md:block">
        {formatHour(item.hour, item.minutes)}
      </span>
      <span className="hidden truncate text-sm font-medium text-slate-600 md:block">
        {dateLabel(item)}
      </span>
      <span
        className={`hidden text-sm font-black md:block ${
          item.isFinished ? 'text-slate-500' : 'text-emerald-600'
        }`}
      >
        {formatCLP(item.price)}
      </span>
      <span className="hidden md:block">
        <Badge item={item} />
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
        aria-hidden="true"
      />
    </button>
  </li>
);

const GroupSection: React.FC<{
  group: RecurringGroup;
  onSelect: (item: RecurringItem) => void;
}> = ({ group, onSelect }) => (
  <section className="rounded-2xl border border-slate-200 bg-white">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-slate-50 px-3 py-2.5 sm:px-4">
      <h3 className="text-sm font-black text-slate-900">
        {group.label}
        <span className="ml-2 text-xs font-semibold text-slate-500">
          {group.items.length} {group.items.length === 1 ? 'reserva' : 'reservas'}
        </span>
      </h3>
      {group.income > 0 && (
        <span
          title="Ingreso semanal estimado de las recurrencias activas"
          className="shrink-0 text-xs font-black text-emerald-600"
        >
          {formatCLP(group.income)}
        </span>
      )}
    </header>
    <ul className="divide-y divide-slate-100">
      {group.items.map((item) => (
        <RecurringRow key={`${item.kind}-${item.id}`} item={item} onSelect={onSelect} />
      ))}
    </ul>
  </section>
);

const ColumnHeader: React.FC = () => (
  <div
    aria-hidden="true"
    className={`hidden px-4 text-xs font-bold text-slate-500 ${ROW_GRID}`}
  >
    <span>Cliente</span>
    <span>Cancha</span>
    <span>Hora</span>
    <span>Próxima</span>
    <span>Precio</span>
    <span>Tipo</span>
    <span />
  </div>
);

const ListSkeleton: React.FC = () => (
  <div className="space-y-3 sm:space-y-4" aria-label="Cargando reservas fijas" role="status">
    {[0, 1, 2].map((group) => (
      <div key={group} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="flex items-center gap-3 border-b border-slate-50 px-4 py-4 last:border-0">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const RecurringList: React.FC<RecurringListProps> = ({
  groups,
  loading,
  hasAnyItems,
  hasFilters,
  hasFinished,
  onSelect,
  onClearFilters,
  onGoToAgenda,
  onShowFinished,
}) => {
  if (loading) return <ListSkeleton />;

  if (groups.length === 0) {
    const filteredEmpty = hasAnyItems && hasFilters;
    const onlyHistory = hasAnyItems && !filteredEmpty && hasFinished;

    const title = filteredEmpty
      ? 'No encontramos reservas fijas'
      : onlyHistory
        ? 'No hay reservas fijas activas'
        : 'Todavía no hay reservas recurrentes';

    const description = filteredEmpty
      ? 'Prueba con otro cliente, cancha o día.'
      : onlyHistory
        ? 'Todas están finalizadas. Revisa el historial para ver su detalle.'
        : 'Crea una reserva recurrente desde la agenda y aparecerá aquí agrupada por día.';

    const actionLabel = filteredEmpty
      ? 'Limpiar filtros'
      : onlyHistory
        ? 'Ver finalizadas'
        : 'Ir a la agenda';

    const handleAction = filteredEmpty ? onClearFilters : onlyHistory ? onShowFinished : onGoToAgenda;

    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Repeat size={24} />
        </span>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        <button
          type="button"
          onClick={handleAction}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition-colors hover:bg-slate-800"
        >
          {actionLabel}
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4" data-testid="recurring-list">
      <ColumnHeader />
      {groups.map((group) => (
        <GroupSection key={group.dayIndex} group={group} onSelect={onSelect} />
      ))}
    </div>
  );
};
