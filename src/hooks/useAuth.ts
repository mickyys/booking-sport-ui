import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import { UserProfile } from "../types";

export const useAuth = () => {
    const { user: auth0User, isAuthenticated, loginWithRedirect, logout, isLoading } = useAuth0();
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (isAuthenticated && auth0User) {
            const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
            const userRole = auth0User[roleClaim];
            setUser({
                name: auth0User.nickname || auth0User.name ||  "Usuario",
                email: auth0User.email || "",
                avatar: auth0User.picture || `https://ui-avatars.com/api/?name=${auth0User.name}&background=10B981&color=fff`,
                role: userRole?.includes('administrator') ? 'administrator' : 'user',
                id: auth0User.sub || ""
            });
        } else {
            setUser(null);
        }
    }, [isAuthenticated, auth0User]);

    return {
        user,
        isAuthenticated,
        isLoading,
        login: loginWithRedirect,
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
        isAdministrator: user?.role === 'administrator'
    };
};