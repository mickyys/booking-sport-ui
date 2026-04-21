"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth0 } from "@auth0/auth0-react";
import { Trophy, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { loginWithRedirect, logout, user: auth0User, isAuthenticated } = useAuth0();

  const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://golazohub.cl/roles';
  const userRole = auth0User?.[roleClaim];
  const isAdministrator = userRole?.includes('administrator');

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => router.push('/')}>
            <Trophy className="text-emerald-400 w-6 h-6" />
            <span className="font-bold text-lg sm:text-xl tracking-tight">Reservalo<span className="text-emerald-400">YA</span></span>
          </div>

          {/* Right side items */}
          <div className="flex items-center gap-1 sm:gap-3 min-w-0">

            {/* Reservar - only for non-admins, hidden on mobile */}
            {!isAdministrator && (
              <>
                <button
                  onClick={() => router.push('/reservar')}
                  className={`hidden md:block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/reservar') ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Reservar
                </button>
                <button
                  onClick={() => {
                    if (pathname === '/') {
                      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      router.push('/contacto');
                    }
                  }}
                  className={`hidden lg:block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/contacto') ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Centros Deportivos
                </button>
              </>
            )}

            {/* Admin button - always visible */}
            {isAdministrator && (
              <button
                onClick={() => router.push('/admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-colors ${isActive('/admin') ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Admin</span>
              </button>
            )}

            {/* Auth section */}
            {isAuthenticated && auth0User ? (
              <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-slate-700">
                <button
                  onClick={() => router.push('/mis-reservas')}
                  className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/mis-reservas') ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                >
                  Mi Perfil
                </button>
                <img
                  src={auth0User.picture || `https://ui-avatars.com/api/?name=${auth0User.name}&background=10B981&color=fff`}
                  alt={auth0User.name}
                  onClick={() => router.push('/mis-reservas')}
                  className="w-8 h-8 rounded-full border border-slate-600 cursor-pointer sm:hidden"
                />
                <button
                  onClick={() => logout({ logoutParams: { returnTo: typeof window !== 'undefined' ? window.location.origin : '' } })}
                  className="text-slate-400 hover:text-red-400 p-1"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="flex items-center gap-1.5 bg-white text-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Ingresar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
