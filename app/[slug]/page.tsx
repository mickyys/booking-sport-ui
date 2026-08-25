import { Metadata } from 'next';
import { Suspense } from 'react';
import SportCenterDetailView from '@/components/views/SportCenterDetailView';
import axios from 'axios';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.golazohub.cl';
    const response = await axios.get(`${backendUrl}/sport-centers/slug/${slug}`);
    const { center } = response.data;
    if (!center) {
      return { title: 'Centro Deportivo | ReservaloYA' };
    }
    return {
      title: `${center.name} | ReservaloYA`,
      description: `Reserva tu cancha en ${center.name} (${center.address}). Consulta disponibilidad, servicios y precios en línea.`,
      openGraph: {
        title: `${center.name} | ReservaloYA`,
        description: `Reserva tu cancha en ${center.name}. ¡No te quedes sin jugar!`,
        images: [center.image || '/images/default-sport-center.jpg'],
      },
    };
  } catch {
    return { title: 'Centro Deportivo | ReservaloYA' };
  }
}

export default async function SportCenterDetailPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Cargando...</p>
        </div>
      }
    >
      <SportCenterDetailView slug={slug} />
    </Suspense>
  );
}