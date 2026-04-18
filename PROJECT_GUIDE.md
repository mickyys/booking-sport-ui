# Plantilla de Proyecto Frontend - ReservaLoYa (Next.js)

## Estructura del Proyecto

```
booking-sport-ui/
├── app/                          # App Router de Next.js
│   ├── page.tsx                  # Página principal
│   ├── admin/                    # Rutas del panel admin
│   │   ├── page.tsx
│   │   ├── courts/page.tsx
│   │   ├── calendar/page.tsx
│   │   └── settings/page.tsx
│   └── mis-reservas/page.tsx
├── src/
│   ├── api/                      # Llamadas HTTP al backend
│   │   ├── axiosInstance.ts      # Configuración Axios
│   │   └── bookingApi.ts         # Endpoints específicos
│   ├── components/               # Componentes React
│   │   ├── ui/                  # Componentes base (shadcn/ui)
│   │   ├── layout/               # Layouts (Navbar, Sidebar)
│   │   ├── views/                # Vistas completas
│   │   │   ├── admin/           # Vistas del panel admin
│   │   │   └── booking/          # Vistas de booking
│   │   ├── booking/             # Componentes de booking
│   │   ├── dashboard/           # Componentes del dashboard
│   │   ├── search/              # Componentes de búsqueda
│   │   └── auth/                # Componentes de auth
│   ├── store/                   # Estado global (Zustand)
│   │   └── useBookingStore.ts   # Store principal
│   ├── context/                  # Contextos de React
│   │   └── AdminPanelContext.tsx
│   ├── hooks/                   # Custom Hooks
│   │   ├── useAuth.ts           # Hook de autenticación
│   │   └── useBooking*.ts
│   ├── types/                   # Definiciones TypeScript
│   │   └── index.ts
│   ├── mapper/                  # Mapeadores de datos
│   │   └── mapBooking.ts
│   ├── utils/                   # Utilidades
│   ├── styles/                  # Estilos globales
│   └── data/                    # Datos estáticos
├── public/                      # Archivos estáticos
├── next.config.ts               # Configuración de Next.js
├── tailwind.config.ts           # Configuración de Tailwind
├── package.json
└── tsconfig.json
```

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js | 16.2.2 |
| Lenguaje | TypeScript | 5.9.3 |
| UI Components | shadcn/ui + Radix UI | - |
| Estilos | Tailwind CSS | 4.1.12 |
| Estado Global | Zustand | 5.0.11 |
| HTTP Client | Axios | 1.13.6 |
| Auth | Auth0 React SDK | 2.15.1 |
| Validación | Zod | 4.3.6 |
| Forms | React Hook Form | 7.72.1 |
| Dates | date-fns | - |
| Notifications | Sonner | 2.0.3 |
| Icons | Lucide React | 0.487.0 |
| Animations | Motion | - |

## Patrones de Arquitectura

### 1. Estructura de Página

```tsx
// app/admin/page.tsx
"use client";
import { AdminAgendaSubPage } from '@/components/views/AdminPanel';

export default function AdminPage() {
  return <AdminAgendaSubPage />;
}
```

### 2. Componentes de Vista

```tsx
// src/components/views/admin/AdminDashboard.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';
import { toast } from 'sonner';

export const AdminDashboard: React.FC<Props> = ({ ...props }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const { adminDashboardData, fetchAdminDashboard } = useBookingStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminDashboard(getAccessTokenSilently);
    }
  }, [isAuthenticated, fetchAdminDashboard, getAccessTokenSilently]);

  // ...
};
```

### 3. Store de Zustand

```tsx
// src/store/useBookingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

interface BookingState {
  // Estado
  sportCenters: SportCenter[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchSportCenters: (filters?: Filters) => Promise<void>;
  setSelectedCenterId: (id: string | null) => void;
}

export const useBookingStore = create<BookingState, [["zustand/persist", Partial<BookingState>]]>(
  persist(
    (set, get) => ({
      // Estado inicial
      sportCenters: [],
      isLoading: false,
      error: null,

      // Acciones
      fetchSportCenters: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const result = await getSportCenters(filters);
          set({ sportCenters: result.data || [] });
        } catch (err) {
          set({ error: 'Error al obtener centros' });
          toast.error('Error al cargar los centros deportivos');
        } finally {
          set({ isLoading: false });
        }
      },
      // ...
    }),
    {
      name: 'booking-storage', // clave en localStorage
      partialize: (state) => ({
        selectedCenterId: state.selectedCenterId,
      }),
    }
  )
);
```

### 4. Context para Admin Panel

```tsx
// src/context/AdminPanelContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';

interface AdminPanelContextType {
  courts: any[];
  dashboardPage: number;
  setDashboardPage: (page: number) => void;
  onSaveCourt: (court: any) => void;
  // ...
}

const AdminPanelContext = createContext<AdminPanelContextType | undefined>(undefined);

export const AdminPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();
  const fetchAdminCourts = useBookingStore(state => state.fetchAdminCourts);

  useEffect(() => {
    fetchAdminCourts(getAccessTokenSilently);
  }, [fetchAdminCourts, getAccessTokenSilently]);

  const value = {
    courts,
    dashboardPage,
    setDashboardPage,
    onSaveCourt,
    // ...
  };

  return (
    <AdminPanelContext.Provider value={value}>
      {children}
    </AdminPanelContext.Provider>
  );
};

export const useAdminPanel = () => {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error('useAdminPanel must be used within AdminPanelProvider');
  }
  return context;
};
```

### 5. API Layer

```tsx
// src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejo global de errores
    if (error.response?.status === 401) {
      // Redirigir a login
    }
    return Promise.reject(error);
  }
);

export default api;

// src/api/bookingApi.ts
import api from './axiosInstance';

export const getSportCenters = async (page = 1, limit = 50) => {
  const response = await api.get('/sport-centers', { params: { page, limit } });
  return response.data;
};

export const getRecurringReservationsByCenter = async (token: string) => {
  const response = await api.get('/admin/recurring', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

### 6. Hook de Autenticación

```tsx
// src/hooks/useAuth.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect, useMemo } from "react";
import { UserProfile } from "../types";

export const useAuth = () => {
  const { user, isAuthenticated, loginWithRedirect, logout, isLoading } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const isAdministrator = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const roleClaim = process.env.NEXT_PUBLIC_AUTHO_ROL_CLAIM || 'https://tu-dominio/roles';
    const userRole = (user as any)[roleClaim];
    return Array.isArray(userRole)
      ? userRole.includes('administrator')
      : userRole?.includes('administrator');
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserProfile({
        name: user.nickname || user.name || "Usuario",
        email: user.email || "",
        avatar: user.picture || `https://ui-avatars.com/api/?name=${user.name}`,
        role: isAdministrator ? 'administrator' : 'user',
        id: user.sub || ""
      });
    }
  }, [isAuthenticated, user, isAdministrator]);

  return {
    user: userProfile,
    isAuthenticated,
    isLoading,
    login: loginWithRedirect,
    logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
    isAdministrator
  };
};
```

### 7. Tipos TypeScript

```tsx
// src/types/index.ts
export type SlotStatus = 'available' | 'reserved' | 'maintenance' | 'passed';

export interface SportCenter {
  id: string;
  name: string;
  slug: string;
  location: string;
  address: string;
  phone?: string;
  email?: string;
  image: string;
  services: string[];
  cancellationHours?: number;
  retentionPercent?: number;
  courts?: number;
}

export interface Court {
  id: string;
  name: string;
  shortName?: string;
  type: string;
  image: string;
  centerId: string;
}

export interface Booking {
  id: string;
  slotId: string;
  courtId: string;
  centerId: string;
  courtName: string;
  sportCenterName: string;
  date: string;
  hour: number;
  price: number;
  finalPrice: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentMethod: 'mercadopago' | 'fintoc' | 'cash';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'administrator';
}
```

## Convenciones de Código

### Nombres de Archivos
- **Componentes**: `PascalCase.tsx` (ej: `AdminDashboard.tsx`)
- **Hooks**: `camelCase.ts` (ej: `useAuth.ts`)
- **Stores**: `camelCase.ts` (ej: `useBookingStore.ts`)
- **Utils**: `camelCase.ts` (ej: `cn.ts`)
- **Tipos**: `PascalCase.ts` o dentro de `types/index.ts`

### Nombres de Variables y Funciones
- **Componentes React**: `PascalCase`
- **Funciones/Variables**: `camelCase`
- **Constantes**: `UPPER_SNAKE_CASE` o `camelCase` si son de ámbito local
- **Interfaces/Types**: `PascalCase`

### Estructura de Componentes

```tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ComponentNameProps {
  title: string;
  onAction: () => void;
  variant?: 'primary' | 'secondary';
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onAction,
  variant = 'primary',
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // lógica
      toast.success('Operación exitosa');
    } catch (error) {
      toast.error('Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl">
      <h2 className="text-lg font-bold">{title}</h2>
      <Button
        onClick={handleClick}
        disabled={loading}
        className={variant === 'primary' ? 'bg-emerald-500' : 'bg-slate-500'}
      >
        {loading ? 'Cargando...' : 'Acción'}
      </Button>
    </div>
  );
};
```

### Llamadas API con Token

```tsx
// Siempre usar este patrón para endpoints protegidos
const fetchData = async () => {
  try {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        scope: "openid profile email"
      }
    });

    const result = await api.get('/protected-endpoint', {
      headers: { Authorization: `Bearer ${token}` }
    });

    setData(result.data);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al cargar datos');
  }
};
```

## Variables de Entorno

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=tu-dominio.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=tu-client-id
NEXT_PUBLIC_APP_AUTH0_AUDIENCE=https://tu-api.com
NEXT_PUBLIC_AUTHO_ROL_CLAIM=https://tu-dominio/roles
```

## Checklist para Nuevos Endpoints

- [ ] Definir tipo en `src/types/index.ts`
- [ ] Crear función API en `src/api/bookingApi.ts`
- [ ] Agregar acción al store en `src/store/useBookingStore.ts`
- [ ] Crear componente de vista si es necesario
- [ ] Conectar con provider/context si es necesario
- [ ] Usar Sonner para notificaciones
- [ ] Manejar estados: loading, error, empty
- [ ] Implementar en backend (Go) primero

## Testing Manual

```bash
# Levantar backend
cd booking-sport
go run cmd/app/main.go

# Levantar frontend
cd booking-sport-ui
npm run dev

# Verificar en navegador
http://localhost:3000
http://localhost:3000/admin
```

## Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build de producción
npm run start    # Iniciar en producción
```

## Estilos con Tailwind

### Clases comunes usadas en el proyecto

```tsx
// Layout
<div className="flex items-center justify-between gap-4">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="space-y-4">

// Tarjetas
<div className="bg-white p-6 rounded-2xl border border-slate-100">
<div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300">

// Texto
<h2 className="text-3xl font-bold text-slate-900">
<p className="text-sm text-slate-500">
<span className="text-emerald-600 font-bold">

// Botones
<button className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold">
<button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl">

// Estados de carga
<div className="animate-spin w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full">

// Badges
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
```

## Tips para Nuevos Desarrolladores

### 1. Agregar un nuevo componente UI (shadcn)
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add toast
```

### 2. Agregar un nuevo estado al store
1. Definir el tipo en la interfaz `BookingState`
2. Agregar el estado inicial
3. Crear la acción asíncrona
4. No olvidar el `toast` para feedback al usuario

### 3. Trabajar con Auth0
- Usar el hook `useAuth()` para obtener usuario, autenticación y rol
- Verificar `isAdministrator` para conditionally render admin features
- Siempre usar `getAccessTokenSilently` con los params correctos para APIs protegidas

### 4. Patrón de empty state
```tsx
{data.length === 0 ? (
  <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center">
    <p className="text-slate-500">No hay datos disponibles.</p>
  </div>
) : (
  // Renderizar lista
)}
```