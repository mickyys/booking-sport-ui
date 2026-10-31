import React from 'react';

export const LegalPage: React.FC<{ title: string; intro?: string; children: React.ReactNode }> = ({ title, intro, children }) => (
  <main className="min-h-screen bg-slate-50 py-12">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{title}</h1>
      {intro && <p className="text-lg text-slate-600 mb-8">{intro}</p>}
      <div className="space-y-8 text-slate-700 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-emerald-600 [&_a]:underline">
        {children}
      </div>
    </div>
  </main>
);
