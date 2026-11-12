export function platformDomain(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'reservaloya.cl';
}

export function normalizeHost(host: string): string {
  let h = (host || '').trim().toLowerCase();
  h = h.replace(/\.$/, '');
  const idx = h.indexOf(':');
  if (idx >= 0) h = h.slice(0, idx);
  return h;
}

export function isApexHost(host: string): boolean {
  const h = normalizeHost(host);
  const pd = platformDomain();
  return (
    h === pd ||
    h === 'www.' + pd ||
    h === 'localhost'
  );
}

// Convierte un host de tenant en su forma canónica para resolverlo contra la API.
// En local los subdominios se simulan con *.localhost / *.local
// (ej: orellana.localhost → orellana.<dominio plataforma>). El resto se devuelve tal cual.
export function canonicalTenantHost(host: string): string {
  const h = normalizeHost(host);
  if (h.endsWith('.localhost') || h.endsWith('.local')) {
    const prefix = h.replace(/^www\./, '').split('.')[0];
    if (prefix) return `${prefix}.${platformDomain()}`;
  }
  return h;
}

// Construye la URL pública del sitio de un tenant. En local apunta a
// {subdomain}.localhost:{puerto}; en dev/prod a https://{subdomain}.{dominio plataforma}.
export function buildTenantSiteUrl(subdomain: string): string {
  const s = (subdomain || '').trim().toLowerCase();
  if (!s) return '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
      const port = window.location.port;
      return `http://${s}.localhost${port ? `:${port}` : ''}`;
    }
  }
  return `https://${s}.${platformDomain()}`;
}
