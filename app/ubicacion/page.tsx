"use client";
import { Metadata } from 'next';
import LocationView from '@/components/views/LocationView';

export const metadata: Metadata = {
  title: 'Ubicación y Servicios | ReservaloYA',
  description: 'Encuentra la ubicación de nuestros centros deportivos y conoce los servicios que ofrecen.',
};

export default function LocationPage() {
  return <LocationView />;
}
