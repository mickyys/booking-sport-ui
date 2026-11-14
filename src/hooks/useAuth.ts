import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect, useMemo } from "react";
import { UserProfile } from "../types";

export const useAuth = () => {
    const { user: auth0User, isAuthenticated, loginWithRedirect, logout, isLoading } = useAuth0();
    const [user, setUser] = useState<UserProfile | null>(null);

    const isAdministrator = useMemo(() => {
        if (!isAuthenticated || !auth0User) return false;
        const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
        const userRole = (auth0User as any)[roleClaim];
        if (Array.isArray(userRole)) {
            return userRole.includes('administrator');
        }
        if (typeof userRole === 'string') {
            return userRole.includes('administrator');
        }
        return false;
    }, [isAuthenticated, auth0User]);

    const isSuperAdmin = useMemo(() => {
        if (!isAuthenticated || !auth0User) return false;
        const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
        const raw = (auth0User as any)[roleClaim];
        const roles: string[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
        return roles.some((r) => String(r).trim().toLowerCase() === 'superadmin');
    }, [isAuthenticated, auth0User]);

    // DEPURACIÓN: muestra el usuario y los roles que llegan en el ID token.
    useEffect(() => {
        if (!isAuthenticated || !auth0User) return;
        const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
        const userRole = (auth0User as any)[roleClaim];
        const roles: string[] = Array.isArray(userRole) ? userRole : typeof userRole === 'string' ? [userRole] : [];
        console.log('[useAuth] usuario', {
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
        });
        console.log('[useAuth] roles (ID token)', { claim: roleClaim, roles, isAdministrator, isSuperAdmin });
        console.log('[useAuth] claims del ID token', Object.keys(auth0User).filter((k) => k.endsWith('/roles') || k === 'roles'));
    }, [isAuthenticated, auth0User, isAdministrator, isSuperAdmin]);

    useEffect(() => {
        if (isAuthenticated && auth0User) {
            setUser({
                name: auth0User.nickname || auth0User.name ||  "Usuario",
                email: auth0User.email || "",
                avatar: auth0User.picture || `https://ui-avatars.com/api/?name=${auth0User.name}&background=10B981&color=fff`,
                role: isAdministrator ? 'administrator' : 'user',
                id: auth0User.sub || ""
            });
        } else {
            setUser(null);
        }
    }, [isAuthenticated, auth0User, isAdministrator]);

    return {
        user,
        isAuthenticated,
        isLoading,
        login: loginWithRedirect,
        logout: () => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } }),
        isAdministrator,
        isSuperAdmin
    };
};
