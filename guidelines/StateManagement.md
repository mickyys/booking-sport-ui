# Guía Técnica: Arquitectura y Buenas Prácticas

Este documento define la arquitectura, estándares de desarrollo y buenas prácticas para el proyecto `booking-sport-ui`.

## 1. Stack Tecnológico de Estado y Datos
*   **Gestor de Estado Global (UI):** [Zustand](https://github.com/pmndrs/zustand)
*   **Cliente HTTP:** [Axios](https://axios-http.com/)
*   **Gestión de Datos del Servidor:** [TanStack Query (React Query)](https://tanstack.com/query/latest)

## 2. Características del Proyecto
*   **Mobile First:** Diseño responsivo priorizando la experiencia en dispositivos móviles.
*   **Componentes de UI:** Basado en [shadcn/ui](https://ui.shadcn.com/) para componentes consistentes y accesibles.
*   **Animaciones:** Uso de `motion/react` (Framer Motion) para transiciones fluidas.
*   **Tipado Estricto:** TypeScript en todo el proyecto para evitar errores en tiempo de ejecución.
*   **Variables de Entorno:** Centralización de configuraciones (URLs de API, IDs de Auth0) en archivos `.env`.

## 3. Buenas Prácticas Requeridas

### 3.1 Separación de Responsabilidades
1.  **Componentes (src/components):** Solo deben manejar la lógica de presentación y estados locales de UI. No deben realizar llamadas a APIs.
2.  **Hooks de API (src/hooks/api):** Centralizan las llamadas de `TanStack Query` y `Axios`.
3.  **Servicios (src/services):** Funciones puras de Axios que ejecutan las peticiones HTTP.
4.  **Stores (src/store):** Manejan estado global que sobrevive a cambios de ruta pero que no proviene directamente de una base de datos.

### 3.2 Manejo de Llamadas Externas
*   **Instancia de Axios:** Utilizar siempre la instancia centralizada para inyectar automáticamente tokens y manejar errores globales.
*   **Tratamiento de Datos:** Mapear los datos del backend al formato del frontend en los servicios o hooks, nunca directamente en los componentes.
*   **Loading & Error States:** Cada llamada a API debe manejar sus estados de "Cargando" y "Error" visualmente (Skeletons, Toasts).

### 3.3 Convenciones de Código
*   **Nomenclatura:**
    *   Componentes: `PascalCase` (ej: `PaymentModal.tsx`).
    *   Hooks: `camelCase` con prefijo `use` (ej: `useBooking.ts`).
    *   Tipos/Interfaces: `PascalCase` (ej: `SportCenter`).
*   **Clean Code:**
    *   Funciones pequeñas que hagan una sola cosa.
    *   Evitar el "Prop Drilling" excesivo; usar Zustand o Composición si es necesario.
    *   No hardcodear strings o números mágicos; usar constantes o variables de entorno.

## 4. Ejemplos de Implementación

### 4.1 Configuración de Axios (`src/api/axiosInstance.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar tokens de Auth0 si es necesario
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token'); // O desde el store de Zustand
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## 3. Definición de Stores (Zustand)
Los stores deben ubicarse en `src/store/` y separarse por dominio (ui, auth, etc.).

```typescript
import { create } from 'zustand';

interface UIState {
  currentView: string;
  selectedCenterId: string | number | null;
  setCurrentView: (view: string) => void;
  setSelectedCenterId: (id: string | number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'home',
  selectedCenterId: null,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedCenterId: (id) => set({ selectedCenterId: id }),
}));
```

## 4. Hooks de Datos (React Query + Axios)
Toda llamada a la API debe envolverse en un custom hook dentro de `src/hooks/api/`. No realizar llamadas `fetch/axios` directamente en los componentes.

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';
import { SportCenter } from '../../types';

export const useSportCenters = () => {
  return useQuery({
    queryKey: ['sport-centers'],
    queryFn: async () => {
      const { data } = await api.get<SportCenter[]>('/sport-centers');
      return data;
    },
  });
};
```

## 5. Reglas de Implementación
1.  **Prohibido usar `useFetch` o `fetch` nativo:** Siempre usar la instancia de `api` (Axios).
2.  **Estado del Servidor != Estado de UI:**
    *   Usa **TanStack Query** para datos que vienen de la base de datos (centros, canchas, reservas).
    *   Usa **Zustand** para interactividad de la interfaz (modales abiertos, filtros temporales, sesión de usuario).
3.  **Tipado Estricto:** Todas las respuestas de Axios deben estar tipadas utilizando los interfaces definidos en `src/types/index.ts`.
4.  **Variables de Entorno:** Nunca hardcodear URLs. Usar siempre `import.meta.env.VITE_API_URL`.

---
*Fecha de última actualización: 14 de marzo de 2026*
