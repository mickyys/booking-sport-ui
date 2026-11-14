import Link from 'next/link';

export const metadata = {
  title: 'ReservaloYA — Reserva fácil, disfruta más',
  description: 'Descubre espacios deportivos y recreativos, consulta disponibilidad y reserva en pocos pasos.',
};

const features = [
  { icon: '🔎', title: 'Encuentra espacios', text: 'Descubre centros deportivos y recreativos disponibles para disfrutar de tus actividades favoritas.' },
  { icon: '⚡', title: 'Reserva en línea', text: 'Consulta horarios disponibles y realiza tus reservas sin necesidad de coordinar manualmente.' },
  { icon: '🗂️', title: 'Gestiona tus reservas', text: 'Accede a la información de tus reservas y consulta su estado desde un solo lugar.' },
  { icon: '🔔', title: 'Recibe notificaciones', text: 'Mantente informado sobre confirmaciones, recordatorios y cambios relacionados con tus reservas.' },
];

const centerTools = [
  'Gestión de instalaciones y espacios.',
  'Administración de horarios y disponibilidad.',
  'Control de reservas.',
  'Administración de clientes.',
  'Gestión de pagos cuando la funcionalidad esté habilitada.',
  'Panel de administración.',
  'Información centralizada para facilitar la operación diaria.',
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="font-semibold uppercase tracking-wide text-emerald-100">Reserva fácil, disfruta más</p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-extrabold tracking-tight">Tu próximo espacio está a un clic</h1>
          <p className="mt-6 text-lg sm:text-xl text-emerald-50">
            ReservaloYA conecta a personas con espacios deportivos y recreativos, permitiéndoles descubrir instalaciones, consultar disponibilidad y reservar de manera sencilla desde su celular o computador.
          </p>
          <p className="mt-4 text-emerald-50">
            Olvídate de coordinar horarios por mensajes o llamadas. Encuentra tu espacio, elige el horario que más te acomode y reserva en pocos pasos.
          </p>
          <Link href="/" className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 shadow hover:bg-emerald-50">Buscar un espacio</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">¿Qué puedes hacer con ReservaloYA?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl" aria-hidden>{f.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Para centros deportivos y recreativos</h2>
            <p className="mt-4 text-slate-600">¿Administras una cancha, un complejo deportivo o un espacio recreativo?</p>
            <p className="mt-2 text-slate-600">ReservaloYA también ofrece herramientas para que los centros puedan digitalizar y simplificar su administración.</p>
            <Link href="/contacto" className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">Incorpora tu centro</Link>
          </div>
          <ul className="mt-8 lg:mt-0 space-y-3">
            {centerTools.map((t) => (
              <li key={t} className="flex gap-3 text-slate-700">
                <span className="mt-0.5 text-emerald-500" aria-hidden>✓</span>{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Reserva. Organiza. Disfruta.</h2>
        <p className="mt-3 text-slate-600">Queremos que reservar un espacio sea tan sencillo como elegir un horario.</p>
        <p className="mt-4 text-xl font-bold text-emerald-600">ReservaloYA: tu espacio, tu horario, tu reserva.</p>
        <p className="mt-10 text-slate-600">¿Quieres conocer más sobre nuestra plataforma o incorporar tu centro?</p>
        <a href="mailto:contacto@reservaloYA.cl" className="mt-2 inline-block font-semibold text-emerald-600 underline">contacto@reservaloYA.cl</a>
        <p className="mt-2 text-slate-500"><a href="https://reservaloYA.cl" className="underline">https://reservaloYA.cl</a></p>
      </section>
    </main>
  );
}
