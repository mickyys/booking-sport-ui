"use client";
import { Metadata } from 'next';
import ContactView from '@/components/views/ContactView';

export const metadata: Metadata = {
  title: 'Contacto | ReservaloYA',
  description: '¿Eres dueño de un centro deportivo? Contáctanos para unirte a nuestra plataforma.',
};

export default function ContactPage() {
  return <ContactView />;
}
