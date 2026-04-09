"use client";
import { Metadata } from 'next';
import HomeView from '../src/components/views/HomeView';

export const metadata: Metadata = {
  title: 'ReservaloYA - Busca y reserva tu cancha deportiva',
  description: 'Encuentra los mejores centros deportivos en tu ciudad. Reserva canchas de fútbol, pádel y más de forma rápida y sencilla.',
};

export default function HomePage() {
  return <HomeView />;
}
