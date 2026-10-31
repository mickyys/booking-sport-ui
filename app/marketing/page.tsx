import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'ReservaloYA | Reserva tu cancha deportiva',
  description: 'La plataforma más fácil para reservar canchas de fútbol, pádel y más.',
};

export default function MarketingPage() {
  return (
    <LegalPage title="ReservaloYA" intro="La forma más fácil de reservar tu cancha deportiva.">
      <section>
        <h2>¿Qué es ReservaloYA?</h2>
        <p>
          Una plataforma para reservar canchas de fútbol, pádel y otros deportes en centros deportivos de Chile,
          con disponibilidad en tiempo real y pago en línea.
        </p>
      </section>
      <section>
        <h2>Funciones</h2>
        <ul>
          <li>Reserva en pocos pasos, a cualquier hora.</li>
          <li>Pago seguro con Mercado Pago.</li>
          <li>Planes de socio y códigos de descuento.</li>
          <li>Gestión de tus reservas desde el celular.</li>
        </ul>
      </section>
      <section>
        <h2>¿Tienes un centro deportivo?</h2>
        <p>Digitaliza la gestión de tus canchas. <Link href="/contacto">Contáctanos</Link>.</p>
      </section>
    </LegalPage>
  );
}
