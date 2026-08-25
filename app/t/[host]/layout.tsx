import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Tenant } from '@/types';
import { normalizeHost, canonicalTenantHost } from '@/utils/host';

type Props = {
  params: Promise<{ host: string }>;
};

async function getTenant(host: string): Promise<Tenant | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  try {
    const res = await fetch(`${base}/tenants/host/${encodeURIComponent(canonicalTenantHost(normalizeHost(host)))}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as Tenant;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const tenant = await getTenant(host);
  if (!tenant) {
    return { title: 'Sitio no encontrado | ReservaloYA' };
  }
  const title = `${tenant.name} | ReservaloYA`;
  const description = `Reserva tu cancha en ${tenant.name}. Consulta disponibilidad, precios y reserva en línea de forma rápida y segura.`;
  return {
    title,
    description,
    alternates: { canonical: `https://${tenant.canonical_host}` },
    openGraph: {
      title,
      description,
      images: [tenant.branding?.logo_url || '/images/default-sport-center.jpg'],
    },
  };
}

export default async function TenantLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { host } = await params;
  const tenant = await getTenant(host);
  if (!tenant) {
    notFound();
  }
  return <>{children}</>;
}