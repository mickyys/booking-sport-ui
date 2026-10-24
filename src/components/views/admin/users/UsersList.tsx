"use client";

import React, { useState } from 'react';
import { ChevronRight, UserPlus, Users } from 'lucide-react';
import {
  CenterUser,
  formatLastLogin,
  getDisplayName,
  getInitials,
} from './usersUtils';

interface UsersListProps {
  users: CenterUser[];
  currentUserId: string;
  loading: boolean;
  hasQuery: boolean;
  onSelect: (user: CenterUser) => void;
  onInvite: () => void;
  onClearQuery: () => void;
}

const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_1rem] md:items-center md:gap-3';

const Avatar: React.FC<{ user: CenterUser }> = ({ user }) => {
  const [failed, setFailed] = useState(false);
  if (user.picture && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.picture}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700"
    >
      {getInitials(user)}
    </span>
  );
};

const ListSkeleton: React.FC = () => (
  <div
    role="status"
    aria-label="Cargando usuarios"
    className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
  >
    {[0, 1, 2].map((row) => (
      <div key={row} className="flex items-center gap-3 px-4 py-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

export const UsersList: React.FC<UsersListProps> = ({
  users,
  currentUserId,
  loading,
  hasQuery,
  onSelect,
  onInvite,
  onClearQuery,
}) => {
  if (loading) return <ListSkeleton />;

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-12">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Users size={24} />
        </span>
        <p className="text-sm font-black text-slate-800">
          {hasQuery ? 'No encontramos usuarios' : 'Todavía no hay administradores'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {hasQuery
            ? 'Prueba con otro nombre o correo.'
            : 'Agrega a alguien para que pueda gestionar este centro.'}
        </p>
        <button
          type="button"
          onClick={hasQuery ? onClearQuery : onInvite}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
        >
          {hasQuery ? 'Limpiar búsqueda' : (<><UserPlus size={15} />Agregar administrador</>)}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="users-list" className="rounded-2xl border border-slate-200 bg-white">
      <div
        aria-hidden="true"
        className={`hidden border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 ${ROW_GRID}`}
      >
        <span>Usuario</span>
        <span>Correo</span>
        <span>Último ingreso</span>
        <span />
      </div>
      <ul className="divide-y divide-slate-100">
        {users.map((user) => (
          <li key={user.user_id}>
            <button
              type="button"
              onClick={() => onSelect(user)}
              aria-label={`Ver detalle de ${getDisplayName(user)}`}
              className={`group flex min-h-16 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400/60 sm:px-4 ${ROW_GRID}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
                <Avatar user={user} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-black text-slate-900">
                      {getDisplayName(user)}
                    </span>
                    {user.user_id === currentUserId && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        Tú
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-slate-500 md:hidden">
                    {user.email || 'Sin correo'}
                  </span>
                </span>
              </span>
              <span className="hidden truncate text-sm font-medium text-slate-600 md:block">
                {user.email || '—'}
              </span>
              <span className="hidden text-sm font-medium text-slate-600 md:block">
                {formatLastLogin(user.last_login)}
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
