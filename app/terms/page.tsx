import { LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Términos de uso | ReservaloYA',
  description: 'Condiciones de uso de ReservaloYA.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" intro="Última actualización: octubre de 2026.">
      <section>
        <h2>Uso del servicio</h2>
        <p>
          ReservaloYA permite reservar canchas en centros deportivos. Al usarlo aceptas estos términos y te comprometes
          a entregar información verdadera y a usar la plataforma de forma lícita.
        </p>
      </section>
      <section>
        <h2>Reservas y pagos</h2>
        <p>
          Las reservas se confirman una vez acreditado el pago a través de Mercado Pago. Precios, horarios y políticas de
          cancelación son definidos por cada centro deportivo.
        </p>
      </section>
      <section>
        <h2>Responsabilidad</h2>
        <p>
          El centro deportivo es responsable de la prestación del servicio en sus instalaciones. ReservaloYA actúa como
          intermediario tecnológico.
        </p>
      </section>
      <section>
        <h2>Contacto</h2>
        <p><a href="mailto:contacto@reservaloya.cl">contacto@reservaloya.cl</a></p>
      </section>
    </LegalPage>
  );
}
