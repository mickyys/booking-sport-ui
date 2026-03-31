import React from 'react';

const EmptySearchResults: React.FC = () => {
  return (
    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-12">
      <p className="text-slate-500 font-medium text-lg">
        No se encontraron centros deportivos disponibles en este momento.
      </p>
    </div>
  );
};

export default EmptySearchResults;
