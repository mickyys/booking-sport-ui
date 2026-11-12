"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UsersList } from './users/UsersList';
import { UserInviteDialog } from './users/UserInviteDialog';
import { UserDetailDialog } from './users/UserDetailDialog';
import { CenterUser, filterUsers, getDisplayName } from './users/usersUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const AdminUsers: React.FC = () => {
    const { user: auth0User, getAccessTokenSilently } = useAuth0();
    const currentUserId = auth0User?.sub || '';

    const [users, setUsers] = useState<CenterUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<CenterUser | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [toRemove, setToRemove] = useState<CenterUser | null>(null);
    const [removing, setRemoving] = useState(false);
    const [resending, setResending] = useState(false);

    const authHeaders = useCallback(async () => {
        const token = await getAccessTokenSilently();
        return { Authorization: `Bearer ${token}` };
    }, [getAccessTokenSilently]);

    const loadUsers = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/admin/users`, { headers: await authHeaders() });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            const list = (data.users || []) as CenterUser[];
            setUsers(
                list.map((u) =>
                    u.user_id === currentUserId
                        ? {
                              ...u,
                              name: auth0User?.name || auth0User?.nickname || u.name,
                              email: auth0User?.email || u.email,
                              picture: auth0User?.picture || u.picture,
                          }
                        : u,
                ),
            );
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    }, [authHeaders, currentUserId, auth0User]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const visibleUsers = useMemo(() => filterUsers(users, query), [users, query]);

    const handleInvite = async (data: { email: string; nombre: string }) => {
        setInviting(true);
        setInviteError('');
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                setInviteError(body.error || 'No se pudo agregar al administrador');
                return;
            }
            setInviteOpen(false);
            if (body.email_sent === false) {
                toast.warning('Administrador agregado, pero no se pudo enviar el correo de invitación');
            } else {
                toast.success('Administrador agregado. Le enviamos un correo de invitación');
            }
            await loadUsers();
        } catch (error) {
            console.error('Error inviting user:', error);
            setInviteError('No se pudo agregar al administrador');
        } finally {
            setInviting(false);
        }
    };

    const handleResend = async (user: CenterUser) => {
        setResending(true);
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, nombre: user.name, resend: true }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                toast.error(body.error || 'No se pudo reenviar la invitación');
                return;
            }
            if (body.email_sent === false) {
                toast.warning('Rol confirmado, pero no se pudo enviar el correo');
            } else {
                toast.success('Invitación reenviada y rol de administrador confirmado');
            }
        } catch (error) {
            console.error('Error resending invitation:', error);
            toast.error('No se pudo reenviar la invitación');
        } finally {
            setResending(false);
        }
    };

    const handleConfirmRemove = async () => {
        if (!toRemove) return;
        setRemoving(true);
        try {
            const response = await fetch(`${API_URL}/admin/users/${encodeURIComponent(toRemove.user_id)}`, {
                method: 'DELETE',
                headers: await authHeaders(),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to remove user');
            }
            toast.success('Acceso eliminado');
            setToRemove(null);
            await loadUsers();
        } catch (error) {
            console.error('Error removing user:', error);
            toast.error('No se pudo quitar el acceso');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div className="space-y-5 pb-6 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="min-w-0 truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Usuarios
                </h1>
                <button
                    type="button"
                    onClick={() => {
                        setInviteError('');
                        setInviteOpen(true);
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-600"
                >
                    <UserPlus size={16} />
                    <span className="max-sm:hidden">Agregar administrador</span>
                    <span className="sm:hidden">Agregar</span>
                </button>
            </div>

            <div className="relative">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar por nombre o correo"
                    aria-label="Buscar usuarios por nombre o correo"
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
            </div>

            {!loading && (
                <p aria-live="polite" className="px-1 text-xs font-medium text-slate-500">
                    {users.length} {users.length === 1 ? 'administrador' : 'administradores'} con acceso a este centro
                </p>
            )}

            <UsersList
                users={visibleUsers}
                currentUserId={currentUserId}
                loading={loading}
                hasQuery={query.trim() !== ''}
                onSelect={(user) => {
                    setSelected(user);
                    setDetailOpen(true);
                }}
                onInvite={() => setInviteOpen(true)}
                onClearQuery={() => setQuery('')}
            />

            <UserInviteDialog
                open={inviteOpen}
                submitting={inviting}
                error={inviteError}
                onOpenChange={setInviteOpen}
                onSubmit={handleInvite}
            />

            <UserDetailDialog
                user={selected}
                isSelf={!!selected && selected.user_id === currentUserId}
                isLastAdmin={users.length <= 1}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                resending={resending}
                onRemove={setToRemove}
                onResend={handleResend}
            />

            <AlertDialog open={!!toRemove} onOpenChange={(open) => !open && !removing && setToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar el acceso de {toRemove && getDisplayName(toRemove)}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta persona dejará de ver este centro en el panel. Podrás volver a agregarla después.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={removing}>No, mantener</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={removing}
                            onClick={(event) => {
                                event.preventDefault();
                                handleConfirmRemove();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {removing ? 'Quitando…' : 'Sí, quitar acceso'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
