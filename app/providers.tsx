"use client";
'use client';

import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "";
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined
      }}
    >
      {children}
      <Toaster richColors position="top-center" />
    </Auth0Provider>
  );
}
