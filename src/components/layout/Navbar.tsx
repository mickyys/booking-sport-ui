import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Trophy, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../../types';

interface NavbarProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onViewChange, currentView }) => {
  const { loginWithRedirect, logout, user: auth0User, isAuthenticated } = useAuth0();

  // Obtener el claim personalizado (debe coincidir con la lógica en App.tsx)
  const roleClaim = import.meta.env.VITE_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
  const userRole = auth0User?.[roleClaim];

  // Lógica de administrador consistente con App.tsx
  const isAdministrator = userRole?.includes('administrator')
  console.log("NAVBAR - User Role:", userRole, "Is Admin:", isAdministrator);
  console.log("NAVBAR - Auth0 User:", auth0User);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
            <Trophy className="text-emerald-400 w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">Reservalo<span className="text-emerald-400">YA</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange('info')}
              className={`hidden md:block px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'info' ? 'text-white bg-slate-800' : 'text-slate-300 hover:text-white'}`}
            >
              Ubicación
            </button>

            {isAdministrator && (
              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </button>
            )}

            {!isAdministrator && (
              <button
                onClick={() => onViewChange('book')}
                className={`hidden md:block px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'book' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              >
                Reservar
              </button>
            )}

            {isAuthenticated && auth0User ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onViewChange('client-dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'client-dashboard' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Mi Perfil
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                  <img
                    src={auth0User.picture || `https://ui-avatars.com/api/?name=${auth0User.name}&background=10B981&color=fff`}
                    alt={auth0User.name}
                    className="w-8 h-8 rounded-full border border-slate-600"
                  />
                  <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="text-slate-400 hover:text-red-400 p-1"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                Ingresar
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
