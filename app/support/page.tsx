import Link from 'next/link';

export const metadata = {
  title: 'Centro de Soporte | ReservaloYA',
  description: 'Ayuda con tu cuenta, reservas, pagos y más en ReservaloYA.',
};

const EMAIL = 'contacto@reservaloYA.cl';

const categories = [
  { icon: '👤', title: 'Problemas con tu cuenta', items: ['Registro e inicio de sesión.', 'Acceso mediante Google.', 'Actualización de tus datos personales.', 'Solicitud de eliminación de cuenta.'] },
  { icon: '📅', title: 'Reservas', items: ['Cómo realizar una reserva.', 'Consultar el estado de una reserva.', 'Modificar o cancelar una reserva.', 'Problemas con la disponibilidad de horarios.'] },
  { icon: '💳', title: 'Pagos', items: ['Consultas sobre pagos.', 'Verificación del estado de una transacción.', 'Problemas durante el proceso de pago.', 'Consultas sobre devoluciones o anulaciones.'] },
  { icon: '📱', title: 'Aplicación móvil', items: ['Problemas de funcionamiento.', 'Notificaciones y recordatorios.', 'Instalación y actualización de la aplicación.'] },
  { icon: '🏟️', title: 'Centros deportivos', items: ['Consultas sobre instalaciones y horarios.', 'Información sobre reservas.', 'Contacto con el centro correspondiente.'] },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            ¿Necesitas <span className="text-emerald-600">ayuda</span>?
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Estamos aquí para ayudarte. En ReservaloYA queremos que reservar y administrar espacios deportivos y recreativos sea una experiencia sencilla y segura.
          </p>
        </header>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">¿Con qué podemos ayudarte?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <section key={c.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden>{c.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{c.title}</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 marker:text-emerald-500">
                {c.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold">Contacto</h2>
          <p className="mt-2 text-emerald-50">Si no encuentras una solución, puedes escribirnos:</p>
          <a href={`mailto:${EMAIL}`} className="mt-4 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-emerald-700 hover:bg-emerald-50">{EMAIL}</a>
          <p className="mt-4 text-sm text-emerald-50">
            Te recomendamos indicar tu nombre, el correo asociado a tu cuenta y una descripción del problema. Si tu consulta está relacionada con una reserva, incluye su identificador cuando esté disponible.
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 text-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Protección de datos personales</h2>
          <p>
            Para consultas sobre privacidad, acceso, rectificación o eliminación de datos personales, puedes escribir a{' '}
            <a className="text-emerald-600 underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>. Revisa también nuestra{' '}
            <Link className="text-emerald-600 underline" href="/terms">Política de Privacidad</Link>.
          </p>
          <dl className="mt-4 space-y-1">
            <div><dt className="inline font-semibold">Responsable: </dt><dd className="inline">Hector Martinez SpA</dd></div>
            <div><dt className="inline font-semibold">Nombre comercial: </dt><dd className="inline">ReservaloYA</dd></div>
            <div><dt className="inline font-semibold">RUT: </dt><dd className="inline">77.331.094-7</dd></div>
            <div><dt className="inline font-semibold">Sitio web: </dt><dd className="inline"><a className="text-emerald-600 underline" href="https://reservaloYA.cl">https://reservaloYA.cl</a></dd></div>
          </dl>
          <p className="mt-4">Nuestro equipo revisará tu solicitud y te responderá a la brevedad.</p>
        </section>
      </div>
    </main>
  );
}
