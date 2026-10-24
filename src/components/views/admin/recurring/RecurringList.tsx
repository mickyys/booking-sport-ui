"use client";

import React from 'react';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  Repeat,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  RecurringGroup,
  RecurringItem,
  formatCLP,
  formatHour,
  formatRelativeDay,
  formatShortDate,
  getInitials,
} from './recurringUtils';

interface RecurringListProps {
  groups: RecurringGroup[];
  loading: boolean;
  hasAnyItems: boolean;
  hasFilters: boolean;
  hasFinished: boolean;
  onSelect: (item: RecurringItem) => void;
  onFinish: (item: RecurringItem) => void;
  onClearFilters: () => void;
  onGoToAgenda: () => void;
  onShowFinished: () => void;
}

const KindBadge: React.FC<{ item: RecurringItem }> = ({ item }) => {
  if (item.isFinished) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <CheckCircle2 size={10} />
        Finalizada
      </span>
    );
  }

  if (item.kind === 'weekly') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
        <Repeat size={10} />
        Indefinida
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
      <CalendarRange size={10} />
      Serie
    </span>
  );
};

const avatarClass = (item: RecurringItem): string => {
  if (item.isFinished) return 'bg-slate-100 text-slate-500';
  if (item.kind === 'weekly') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
};

const dateLabel = (item: RecurringItem): string => {
  if (item.isFinished) {
    return `Finalizada ${formatShortDate(item.finishedAt)}`;
  }
  if (item.nextDate) return formatRelativeDay(item.nextDate);
  return 'Sin próximas fechas';
};

const RecurringRow: React.FC<{
  item: RecurringItem;
  onSelect: (item: RecurringItem) => void;
  onFinish: (item: RecurringItem) => void;
}> = ({ item, onSelect, onFinish }) => (
  <li className="group transition-colors hover:bg-slate-50/80">
    <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:items-center"
        aria-label={`Ver detalle de ${item.customerName}`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${avatarClass(item)}`}
          aria-hidden="true"
        >
          {getInitials(item.customerName)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-black text-slate-900 sm:text-[15px]">
              {item.customerName}
            </span>
            <KindBadge item={item} />
          </span>
          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
            {item.customerPhone || 'Sin teléfono'}
          </span>

          <span className="mt-2 grid grid-cols-2 gap-2 md:hidden">
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Cancha
              </span>
              <span className="block truncate text-xs font-bold text-slate-700">{item.courtName}</span>
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Horario
              </span>
              <span className="block truncate text-xs font-bold text-slate-700">
                {item.dayLabel} · {formatHour(item.hour, item.minutes)}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Próxima
              </span>
              <span className="block truncate text-xs font-bold text-slate-700">{dateLabel(item)}</span>
            </span>
            <span className="min-w-0 text-right">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Precio
              </span>
              <span className="block truncate text-xs font-black text-emerald-600">
                {formatCLP(item.price)}
              </span>
            </span>
          </span>
        </span>

        <span className="hidden w-40 shrink-0 md:block lg:w-44">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Trophy size={10} />
            Cancha
          </span>
          <span className="mt-0.5 block truncate text-sm font-bold text-slate-700">
            {item.courtName}
          </span>
        </span>

        <span className="hidden w-36 shrink-0 md:block">
          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Clock size={10} />
            Horario
          </span>
          <span className="mt-0.5 block text-sm font-bold text-slate-700">
            {formatHour(item.hour, item.minutes)}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">
            {dateLabel(item)}
          </span>
        </span>

        <span className="hidden w-24 shrink-0 text-right lg:block">
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
            Precio
          </span>
          <span
            className={`mt-0.5 block text-sm font-black ${
              item.isFinished ? 'text-slate-500' : 'text-emerald-600'
            }`}
          >
            {formatCLP(item.price)}
          </span>
        </span>

        <ChevronRight
          size={18}
          className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 sm:mt-0"
          aria-hidden="true"
        />
      </button>

      {!item.isFinished && (
        <button
          type="button"
          onClick={() => onFinish(item)}
          aria-label={`Finalizar recurrencia de ${item.customerName}`}
          title="Finalizar recurrencia"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </li>
);

const GroupSection: React.FC<{
  group: RecurringGroup;
  onSelect: (item: RecurringItem) => void;
  onFinish: (item: RecurringItem) => void;
}> = ({ group, onSelect, onFinish }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-wide text-slate-600">
          {group.short}
        </span>
        <h3 className="truncate text-sm font-black text-slate-900">{group.label}</h3>
        <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
          {group.items.length} {group.items.length === 1 ? 'reserva' : 'reservas'}
        </span>
      </div>
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
        <RecurringRow
          key={`${item.kind}-${item.id}`}
          item={item}
          onSelect={onSelect}
          onFinish={onFinish}
        />
      ))}
    </ul>
  </section>
);

const ListSkeleton: React.FC = () => (
  <div className="space-y-3 sm:space-y-4" aria-label="Cargando reservas recurrentes" role="status">
    {[0, 1, 2].map((group) => (
      <div key={group} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        {[0, 1].map((row) => (
          <div key={row} className="flex items-center gap-3 border-b border-slate-50 px-4 py-4 last:border-0">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="hidden h-3 w-20 animate-pulse rounded bg-slate-100 sm:block" />
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
  onFinish,
  onClearFilters,
  onGoToAgenda,
  onShowFinished,
}) => {
  if (loading) return <ListSkeleton />;

  if (groups.length === 0) {
    const filteredEmpty = hasAnyItems && hasFilters;
    const onlyHistory = hasAnyItems && !filteredEmpty && hasFinished;

    const title = filteredEmpty
      ? 'No encontramos recurrencias'
      : onlyHistory
        ? 'No hay recurrencias activas'
        : 'Todavía no hay reservas recurrentes';

    const description = filteredEmpty
      ? 'Prueba con otro cliente, cancha o día; también puedes cambiar de pestaña.'
      : onlyHistory
        ? 'Todas las recurrencias registradas están finalizadas. Revisa el historial para ver su detalle.'
        : 'Crea una reserva recurrente desde la agenda y aparecerá aquí agrupada por día de la semana.';

    const actionLabel = filteredEmpty
      ? 'Limpiar filtros'
      : onlyHistory
        ? 'Ver finalizadas'
        : 'Ir a la agenda';

    const handleAction = filteredEmpty
      ? onClearFilters
      : onlyHistory
        ? onShowFinished
        : onGoToAgenda;

    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Repeat size={24} />
        </span>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{description}</p>
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
      {groups.map((group) => (
        <GroupSection
          key={group.dayIndex}
          group={group}
          onSelect={onSelect}
          onFinish={onFinish}
        />
      ))}
    </div>
  );
};
