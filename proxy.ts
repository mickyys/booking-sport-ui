import { NextRequest, NextResponse } from 'next/server';
import { normalizeHost, isApexHost, canonicalTenantHost, platformDomain } from '@/utils/host';

// Resuelve si un slug tiene subdominio de tenant consultando el backend.
// Devuelve el subdominio canónico o null si no es tenant.
async function resolveTenantSubdomain(slug: string): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${base}/sport-centers/slug/${encodeURIComponent(slug)}`, {
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = await res.json();
      const subdomain = json?.center?.subdomain;
      if (subdomain) return subdomain as string;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
  return null;
}

// En un host de tenant, el root "/" se reescribe a la landing del tenant.
// El resto de rutas del app (admin, mis-reservas, booking, [slug]/reservar, etc.)
// funcionan igual bajo cualquier host gracias al TenantProvider global
// (resuelto por hostname en el cliente) y a que el backend ya opera por sport_center_id.
//
// Además, en los hosts apex (reservaloya.cl / www.reservaloya.cl) las URLs
// /{slug}/reservar (usadas por códigos QR) se redirigen al subdominio del tenant
// cuando el slug corresponde a un tenant, para que los visitantes aterricen en
// su sitio (orellana.reservaloya.cl).
export async function proxy(request: NextRequest) {
  const host = normalizeHost(
    request.headers.get('x-forwarded-host') || request.nextUrl.host || '',
  );
  const pathname = request.nextUrl.pathname;

  // Redirección de QRs viejos: apex host + /{slug}/reservar → subdominio del tenant.
  if (isApexHost(host) && host !== 'localhost' && /^\/[^/]+\/reservar$/.test(pathname)) {
    const slug = pathname.split('/')[1];
    const subdomain = await resolveTenantSubdomain(slug);
    if (subdomain) {
      return NextResponse.redirect(`https://${subdomain}.${platformDomain()}`, 308);
    }
  }

  if (isApexHost(host)) {
    return NextResponse.next();
  }

  if (pathname !== '/') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/t/${canonicalTenantHost(host)}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/', '/:slug/reservar'],
};
