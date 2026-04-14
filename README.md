# ReservaLoYa - Gestión de Reservas Deportivas

ReservaLoYa es una plataforma integral para la gestión y reserva de centros deportivos, diseñada para facilitar la interacción entre deportistas y administradores de canchas (fútbol, pádel, etc.).

Este proyecto utiliza **Next.js**, **React 19**, **Tailwind CSS 4** y **Zustand** para ofrecer una experiencia rápida, reactiva y mobile-first.

## 🚀 Tecnologías Principales

- **Frontend:** Next.js (App Router), React 19, TypeScript.
- **Estilos:** Tailwind CSS 4, Lucide React (Iconos), Framer Motion (Animaciones).
- **UI:** Radix UI / Shadcn UI.
- **Estado Global:** Zustand (con persistencia).
- **Autenticación:** Auth0.
- **Pagos:** Integración con MercadoPago y Fintoc.
- **Formularios:** React Hook Form + Zod.
- **Networking:** Axios.

## ✨ Características Principales

### Para Usuarios (Deportistas)
- **Búsqueda Avanzada:** Encuentra centros deportivos por nombre, ciudad, fecha y hora.
- **Reserva en Tiempo Real:** Visualización de disponibilidad de canchas por horas y slots.
- **Múltiples Métodos de Pago:** Paga tus reservas de forma segura con MercadoPago o Fintoc.
- **Mis Reservas:** Panel personal para gestionar reservas actuales, ver historial y cancelar según políticas.
- **Soporte de Invitados:** Permite realizar reservas rápidas sin cuenta completa (opcional).

### Para Administradores
- **Dashboard de Estadísticas:** Visualiza ingresos diarios/totales y flujo de reservas.
- **Gestión de Centros y Canchas:** Administra múltiples canchas, tipos de pasto y servicios adicionales.
- **Control de Horarios:** Configura precios dinámicos por hora, habilita/deshabilita slots y define políticas de cancelación.
- **Reservas Internas:** Crea reservas manuales desde el panel de administración.
- **Generación de QR:** Verifica la validez de las reservas mediante escaneo de códigos QR.

## 📂 Estructura del Proyecto

```text
/
├── app/                  # Rutas de Next.js (Admin, Booking, Dashboard)
├── src/
│   ├── api/              # Servicios de API y configuración de Axios
│   ├── components/       # Componentes de UI y de Negocio (Search, Auth, Layout)
│   ├── context/          # Contextos de React
│   ├── hooks/            # Hooks personalizados para lógica de negocio
│   ├── store/            # Gestión de estado con Zustand
│   ├── types/            # Definiciones de TypeScript
│   └── utils/            # Funciones auxiliares y formateadores
└── public/               # Activos estáticos (Imágenes, Logos)
```

## 🛠️ Instalación y Configuración

### 1. Clonar y preparar dependencias
```bash
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_APP_AUTH0_AUDIENCE=your-api-audience
NEXT_PUBLIC_AUTHO_ROL_CLAIM=https://yourdomain.cl/roles
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en modo Next.js.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia la aplicación compilada.

---
Original design available at [Figma](https://www.figma.com/design/aLKxvNxRH4uatH4X3iZt34/Responsive-Football-Booking-Page).
