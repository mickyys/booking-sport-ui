import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <h1 className="text-8xl font-black text-slate-200">404</h1>
      <h2 className="text-2xl font-bold text-slate-800">Página no encontrada</h2>
      <p className="text-slate-500 max-w-sm">La página que buscas no existe o fue movida.</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        Volver al inicio
      </button>
    </div>
  );
}
