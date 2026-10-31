import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Soporte | ReservaloYA',
  description: 'Centro de ayuda y contacto de ReservaloYA.',
};

export default function SupportPage() {
  return (
    <LegalPage title="Soporte" intro="¿Necesitas ayuda con ReservaloYA? Estamos para ayudarte.">
      <section>
        <h2>Contacto</h2>
        <p>
          Escríbenos a <a href="mailto:contacto@reservaloya.cl">contacto@reservaloya.cl</a> o usa el{' '}
          <Link href="/contacto">formulario de contacto</Link>. Respondemos lo antes posible.
        </p>
      </section>
      <section>
        <h2>Preguntas frecuentes</h2>
        <ul>
          <li><strong>¿Cómo reservo una cancha?</strong> Elige el centro deportivo, la cancha, la fecha y el horario, y confirma el pago.</li>
          <li><strong>¿Cómo cancelo una reserva?</strong> Desde &quot;Mis reservas&quot;, según la política de cancelación de cada centro.</li>
          <li><strong>¿Cómo se paga?</strong> Los pagos se procesan de forma segura con Mercado Pago.</li>
          <li><strong>¿Tuve un problema con un pago?</strong> Escríbenos con el detalle de tu reserva y lo revisaremos.</li>
        </ul>
      </section>
      <section>
        <h2>Eliminar mi cuenta</h2>
        <p>
          Para eliminar tu cuenta y tus datos personales, contacta al equipo de soporte a través del{' '}
          <Link href="/contacto">formulario de contacto</Link> indicando el correo asociado a tu cuenta.
        </p>
      </section>
    </LegalPage>
  );
}
