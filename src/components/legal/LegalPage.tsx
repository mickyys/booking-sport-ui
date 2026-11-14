import React from 'react';
import { Block, Inline } from '@/lib/markdown';

const Inlines: React.FC<{ items: Inline[] }> = ({ items }) => (
  <>
    {items.map((i, k) => {
      const t = i.bold ? <strong className="font-semibold text-slate-900">{i.text}</strong> : i.text;
      return i.href ? (
        <a key={k} href={i.href} className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
          {t}
        </a>
      ) : (
        <React.Fragment key={k}>{t}</React.Fragment>
      );
    })}
  </>
);

export const LegalPage: React.FC<{ blocks: Block[] }> = ({ blocks }) => {
  const title = blocks.find((b) => b.type === 'h1');
  type Heading = { type: 'h1' | 'h2' | 'h3'; text: string; id: string };
  const toc = blocks.filter((b): b is Heading => b.type === 'h2');
  const body = blocks.filter((b) => b !== title);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && title.type === 'h1' && (
          <header className="mb-10 border-b border-slate-200 pb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">{title.text}</h1>
          </header>
        )}
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 text-sm">
              <p className="mb-3 font-semibold uppercase tracking-wide text-slate-500">Contenido</p>
              <ul className="space-y-2">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="text-slate-600 hover:text-emerald-600">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <article className="rounded-2xl bg-white p-6 sm:p-10 shadow-sm ring-1 ring-slate-200 text-slate-700 leading-relaxed space-y-4">
            {body.map((b, k) => {
              switch (b.type) {
                case 'h2':
                  return (
                    <h2 key={k} id={b.id} className="scroll-mt-24 pt-6 text-2xl font-bold text-slate-900 border-t border-slate-100 first:border-0 first:pt-0">
                      {b.text}
                    </h2>
                  );
                case 'h3':
                  return (
                    <h3 key={k} id={b.id} className="scroll-mt-24 pt-2 text-lg font-semibold text-emerald-700">
                      {b.text}
                    </h3>
                  );
                case 'p':
                  return (
                    <p key={k}>
                      <Inlines items={b.inlines} />
                    </p>
                  );
                case 'ul':
                case 'ol': {
                  const L = b.type;
                  return (
                    <L key={k} className={`${L === 'ul' ? 'list-disc' : 'list-decimal'} pl-6 space-y-1 marker:text-emerald-500`}>
                      {b.items.map((it, j) => (
                        <li key={j}>
                          <Inlines items={it} />
                        </li>
                      ))}
                    </L>
                  );
                }
                default:
                  return null;
              }
            })}
          </article>
        </div>
      </div>
    </main>
  );
};
