"use client";

import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
    clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <RouterProvider router={router} />
  </Auth0Provider>
);
