import { BookingVerifyView } from '@/components/views/BookingVerifyView';

export const metadata = {
  title: 'Verificar reserva | ReservaloYA',
  description: 'Consulta los detalles de tu reserva con tu código.',
};

export default function VerifyPage() {
  return <BookingVerifyView />;
}
