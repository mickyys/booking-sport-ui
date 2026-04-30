import HomeView from '../src/components/views/HomeView';
import { Suspense } from 'react';

export const metadata = {
  title: 'ReservaloYA - Busca y reserva tu cancha deportiva',
  description: 'Encuentra los mejores centros deportivos en tu ciudad. Reserva canchas de fútbol, pádel y más de forma rápida y sencilla.',
};

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <HomeView />
    </Suspense>
  );
}
