import Link from 'next/link';

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
      <p>© {new Date().getFullYear()} ReservaloYA. Todos los derechos reservados.</p>
      <nav className="flex gap-4">
        <Link href="/support" className="hover:text-emerald-600">Soporte</Link>
        <Link href="/marketing" className="hover:text-emerald-600">Acerca de</Link>
        <Link href="/privacy" className="hover:text-emerald-600">Privacidad</Link>
        <Link href="/terms" className="hover:text-emerald-600">Términos</Link>
      </nav>
    </div>
  </footer>
);
