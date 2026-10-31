import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata = {
  title: 'Política de privacidad | ReservaloYA',
  description: 'Cómo ReservaloYA recopila y usa tus datos personales.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" intro="Última actualización: octubre de 2026.">
      <section>
        <h2>Datos que recopilamos</h2>
        <ul>
          <li>Datos de cuenta: nombre y correo electrónico, gestionados mediante Auth0 (incluido el inicio de sesión con Google).</li>
          <li>Datos de reservas: centro, cancha, fecha, horario y estado.</li>
          <li>Datos de pago: los procesa Mercado Pago. ReservaloYA no almacena datos de tarjetas.</li>
          <li>Token de notificaciones push, si las activas.</li>
        </ul>
      </section>
      <section>
        <h2>Cómo usamos los datos</h2>
        <ul>
          <li>Gestionar y confirmar tus reservas y pagos.</li>
          <li>Enviarte correos y notificaciones relacionados con tus reservas.</li>
          <li>Mejorar el servicio y prevenir fraude y abuso.</li>
        </ul>
      </section>
      <section>
        <h2>Compartición de datos</h2>
        <p>
          Compartimos los datos necesarios con el centro deportivo donde reservas y con proveedores que operan el servicio
          (Auth0, Mercado Pago, Mailgun, servicios de infraestructura). No vendemos tus datos personales.
        </p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos y de tu cuenta contactando a soporte mediante el{' '}
          <Link href="/contacto">formulario de contacto</Link> o a{' '}
          <a href="mailto:contacto@reservaloya.cl">contacto@reservaloya.cl</a>.
        </p>
      </section>
    </LegalPage>
  );
}
