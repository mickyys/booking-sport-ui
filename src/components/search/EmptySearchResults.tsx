"use client";
import React from 'react';
import { Trophy } from 'lucide-react';

const EmptySearchResults: React.FC = () => {
  return (
    <div className="text-center py-16 sm:py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-12 min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center">
      <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mb-4" />
      <p className="text-slate-500 font-medium text-base sm:text-lg px-4">
        No se encontraron centros deportivos disponibles en este momento.
      </p>
    </div>
  );
};

export default EmptySearchResults;
