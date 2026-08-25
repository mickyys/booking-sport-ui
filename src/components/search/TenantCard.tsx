"use client";

import React from 'react';
import { MapPin, Star, ChevronRight, Car, ShowerHead, Wifi, Coffee, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SportCenter } from '@/types';
import { resolveBranding } from '@/utils/branding';

const ServiceIcon = ({ name }: { name: string }) => {
  const cls = 'w-4 h-4';
  const n = name.toLowerCase();
  if (n.includes('estacionamiento')) return <Car className={cls} />;
  if (n.includes('ducha') || n.includes('camarin') || n.includes('vestuario')) return <ShowerHead className={cls} />;
  if (n.includes('wifi')) return <Wifi className={cls} />;
  if (n.includes('caf') || n.includes('bar')) return <Coffee className={cls} />;
  return <Clock className={cls} />;
};

interface TenantCardProps {
  center: SportCenter;
  index: number;
}

export const TenantCard: React.FC<TenantCardProps> = ({ center, index }) => {
  const branding = resolveBranding(center.branding);
  const courtsCount = center.courts ?? 0;
  const services = center.services || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Hero image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={center.image}
          alt={center.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0" style={{ background: branding.heroGradient }} />
        {/* Live badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {courtsCount} cancha{courtsCount !== 1 ? 's' : ''}
        </div>
        {/* Destacado badge */}
        {center.isFeatured && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-400 px-3 py-1.5 rounded-full text-xs font-bold text-amber-950 shadow-sm">
            <Star className="w-3 h-3 fill-amber-950" />
            Destacado
          </div>
        )}
        {/* Commune badge */}
        {center.city && (
          <div
            className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-sm"
            style={{ backgroundColor: branding.primary + 'cc' }}
          >
            {center.city}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 mb-1">{center.name}</h3>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{center.address || center.location}</span>
            {center.distanceKm != null && (
              <span className="ml-auto shrink-0 text-xs font-semibold text-slate-700 whitespace-nowrap">
                {center.distanceKm < 1
                  ? `A ${Math.round(center.distanceKm * 1000)} m`
                  : `A ${center.distanceKm.toFixed(1)} km`}
              </span>
            )}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-y border-slate-100">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">{courtsCount}</p>
            <p className="text-xs text-slate-500">Canchas</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-lg font-bold text-slate-900">{services.length}</p>
            <p className="text-xs text-slate-500">Servicios</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: branding.primary }}>24/7</p>
            <p className="text-xs text-slate-500">Reservas</p>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {services.slice(0, 3).map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-100"
              >
                <ServiceIcon name={s} />
                <span className="line-clamp-1 max-w-[120px]">{s}</span>
              </span>
            ))}
            {services.length > 3 && (
              <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-100">
                +{services.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link href={`/${center.slug}`} className="no-underline">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: branding.primary }}
            >
              Ver Disponibilidad
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default TenantCard;