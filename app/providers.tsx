"use client";
'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { Toaster } from 'sonner';
import { PushNotificationManager } from '../src/components/PushNotificationManager';
import { useBookingStore } from '../src/store/useBookingStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeStore = useBookingStore(state => state.initialize);
  const router = useRouter();

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Vuelve a la ruta de origen tras el login (ej. se pidió /admin estando
  // deslogueado). Solo se aceptan rutas internas para evitar open redirects.
  const onRedirectCallback = useCallback((appState?: AppState) => {
    const returnTo = appState?.returnTo;
    if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      router.replace(returnTo);
    }
  }, [router]);

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "";
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      // La caché en memoria se perdía al recargar la página: cualquier F5 en
      // /admin dejaba la sesión vacía y ProtectedRoute devolvía a la home.
      cacheLocation="localstorage"
      // Sin refresh token el SDK renueva el token con un iframe silencioso
      // (prompt=none). Con las cookies de terceros bloqueadas ese iframe
      // responde "Login required" y auth0-spa-js hace logout local, lo que
      // expulsaba al admin a la pantalla pública.
      useRefreshTokens
      useRefreshTokensFallback
      onRedirectCallback={onRedirectCallback}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
        audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access'
      }}
    >
      <PushNotificationManager />
      {children}
      <Toaster richColors position="top-center" />
    </Auth0Provider>
  );
}
