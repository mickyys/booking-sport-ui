import { TenantBranding } from '@/types';

export interface BrandingPalette {
  primary: string;
  primaryDark: string;
  accent: string;
  navBg: string;
  heroGradient: string;
  badgeClass: string;
}

export const DEFAULT_BRANDING: BrandingPalette = {
  primary: '#10b981',
  primaryDark: '#059669',
  accent: '#6366f1',
  navBg: '#0f172a',
  heroGradient: 'linear-gradient(to bottom, rgba(15,23,42,0.5), rgba(15,23,42,0.85))',
  badgeClass: 'emerald',
};

// Deriva una paleta completa a partir del branding disponible en el backend.
// Si faltan campos, rellena con valores calculados del color primario.
export function resolveBranding(branding?: TenantBranding | null): BrandingPalette {
  const primary = branding?.primary_color || DEFAULT_BRANDING.primary;
  const primaryDark = branding?.primary_dark || shade(primary, -12);
  return {
    primary,
    primaryDark,
    accent: branding?.accent || DEFAULT_BRANDING.accent,
    navBg: branding?.nav_bg || DEFAULT_BRANDING.navBg,
    heroGradient: branding?.hero_gradient || DEFAULT_BRANDING.heroGradient,
    badgeClass: DEFAULT_BRANDING.badgeClass,
  };
}

// Oscurece/clarea un color hex (amount: -100..100).
export function shade(hex: string, amount: number): string {
  const m = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return DEFAULT_BRANDING.primaryDark;
  const num = parseInt(m, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  if (amount >= 0) {
    r = clamp(r + ((255 - r) * amount) / 100);
    g = clamp(g + ((255 - g) * amount) / 100);
    b = clamp(b + ((255 - b) * amount) / 100);
  } else {
    r = clamp(r + (r * amount) / 100);
    g = clamp(g + (g * amount) / 100);
    b = clamp(b + (b * amount) / 100);
  }
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function hexWithAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}