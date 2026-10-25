import { BookingVerifyView } from '@/components/views/BookingVerifyView';

export const metadata = {
  title: 'Verificar reserva | ReservaloYA',
  description: 'Consulta los detalles de tu reserva con tu código.',
};

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BookingVerifyView code={decodeURIComponent(code)} />;
}
