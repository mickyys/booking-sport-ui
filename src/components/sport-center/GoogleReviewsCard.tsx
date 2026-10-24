"use client";

import React, { useEffect, useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { getGoogleReviews, GoogleReviewsData } from '@/api/bookingApi';

export function useGoogleReviews(slug: string, enabled: boolean) {
  const [data, setData] = useState<GoogleReviewsData | null>(null);

  useEffect(() => {
    if (!slug || !enabled) {
      setData(null);
      return;
    }
    let cancelled = false;
    getGoogleReviews(slug)
      .then((res) => !cancelled && setData(res))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return data;
}

const Stars: React.FC<{ value: number; size?: string }> = ({ value, size = 'h-4 w-4' }) => (
  <span className="inline-flex" role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`${size} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        aria-hidden="true"
      />
    ))}
  </span>
);

export const GoogleRatingChip: React.FC<{ data: GoogleReviewsData }> = ({ data }) => (
  <a
    href="#resenas"
    className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/15 px-3 text-sm font-semibold text-white no-underline backdrop-blur-sm"
  >
    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
    {data.rating.toFixed(1)}
    <span className="font-normal text-white/80">({data.total_reviews})</span>
  </a>
);

export const GoogleReviewsCard: React.FC<{ data: GoogleReviewsData }> = ({ data }) => (
  <section id="resenas" aria-labelledby="resenas-titulo" className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="resenas-titulo" className="text-lg font-bold text-slate-900">Reseñas de Google</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{data.rating.toFixed(1)}</span>
          <Stars value={data.rating} />
          <span className="text-sm text-slate-600">({data.total_reviews})</span>
        </div>
      </div>
      {data.maps_url && (
        <a
          href={data.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
        >
          Ver en Google
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>

    <ul className="space-y-4">
      {data.reviews.filter((r) => r.text).slice(0, 3).map((r, i) => (
        <li key={i} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
          <div className="mb-1 flex items-center gap-3">
            {r.author_photo ? (
              <img src={r.author_photo} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                {r.author?.[0]?.toUpperCase() || '?'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{r.author}</p>
              <div className="flex items-center gap-2">
                <Stars value={r.rating} size="h-3 w-3" />
                {r.relative_time && <span className="text-xs text-slate-500">{r.relative_time}</span>}
              </div>
            </div>
          </div>
          <p className="line-clamp-4 text-sm leading-relaxed text-slate-700">{r.text}</p>
        </li>
      ))}
    </ul>
    <p className="mt-4 text-xs text-slate-500">Reseñas proporcionadas por Google</p>
  </section>
);
