"use client";
import React, { useState, useEffect } from 'react';
import { Users, Trash2, UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';

interface Auth0User {
    user_id: string;
    name: string;
    email: string;
    picture: string;
    last_login?: string;
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<Auth0User[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const hasFetchedRef = React.useRef(false);
    const { user: auth0User, getAccessTokenSilently } = useAuth0();

    const currentUserName = auth0User?.name || auth0User?.nickname || 'Usuario';
    const currentUserEmail = auth0User?.email || '';
    const currentUserPicture = auth0User?.picture || '';
    const currentUserId = auth0User?.sub || '';

    const fetchUsers = React.useCallback(async () => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/users`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            console.log('AdminUsers - Status:', response.status, 'Data:', JSON.stringify(data, null, 2));
            let userList: Auth0User[] = data.users || [];

            if (userList.length === 0) {
                userList = [{
                    user_id: currentUserId,
                    name: currentUserName,
                    email: currentUserEmail,
                    picture: currentUserPicture,
                }];
            } else {
                userList = userList.map((u: Auth0User) => {
                    if (u.user_id === currentUserId) {
                        return {
                            user_id: currentUserId,
                            name: currentUserName || u.name,
                            email: currentUserEmail || u.email,
                            picture: currentUserPicture || u.picture,
                            last_login: u.last_login,
                        };
                    }
                    return u;
                });
            }

            setUsers(userList);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([{
                user_id: currentUserId,
                name: currentUserName,
                email: currentUserEmail,
                picture: currentUserPicture,
                last_login: undefined,
            }]);
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently, currentUserId, currentUserName, currentUserEmail, currentUserPicture]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRemoveUser = async (userId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar el acceso de este usuario?')) {
            return;
        }

        setRemoving(userId);
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to remove user');
            }

            setUsers(users.filter(u => u.user_id !== userId));
            toast.success('Usuario eliminado correctamente');
        } catch (error) {
            console.error('Error removing user:', error);
            toast.error('Error al eliminar usuario');
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl">
                        <Users className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
                        <p className="text-slate-500 text-sm">
                            Gestiona el acceso de usuarios al centro deportivo
                        </p>
                    </div>
                </div>
            </div>

            {users.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No hay usuarios con acceso a este centro</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Usuario</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Último ingreso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.user_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.picture && !imageErrors[user.user_id] ? (
                                                <img
                                                    src={user.picture}
                                                    alt={user.name}
                                                    className="w-10 h-10 rounded-full"
                                                    onError={() => setImageErrors(prev => ({ ...prev, [user.user_id]: true }))}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <span className="font-medium text-slate-900">
                                                {user.name || 'Sin nombre'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {user.email || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {user.last_login ? new Date(user.last_login).toLocaleDateString('es-CL', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </td>
                                   
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
