import Link from 'next/link';

export const Footer = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
      <p>© {new Date().getFullYear()} ReservaloYA</p>
      <nav className="flex gap-5">
        <Link href="/terms" className="hover:text-emerald-600">Términos y privacidad</Link>
        <Link href="/support" className="hover:text-emerald-600">Soporte</Link>
        <Link href="/marketing" className="hover:text-emerald-600">Acerca de</Link>
        <Link href="/contacto" className="hover:text-emerald-600">Contacto</Link>
      </nav>
    </div>
  </footer>
);
