import api from '@/api/axiosInstance';
import type { AccessForm } from '@/types';

export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface AccessAnswer {
  key: string;
  label: string;
  value: string;
}

export interface AccessRequest {
  id: string;
  rut: string;
  email: string;
  name?: string;
  answers?: AccessAnswer[];
  status: AccessStatus;
  reason?: string;
  source: 'form' | 'admin';
  decided_at?: string;
  decided_by_email?: string;
  verified_at?: string;
  last_verified_at?: string;
  created_at: string;
}

type TokenGetter = (options?: any) => Promise<string>;

const STORAGE_PREFIX = 'access_token:';
let activeCenterId = '';

export function setActiveAccessCenter(centerId: string) {
  activeCenterId = centerId;
}

export function getAccessToken(centerId: string): string {
  if (typeof window === 'undefined' || !centerId) return '';
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + centerId);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { token: string; expires_at: string };
    if (!parsed.token || new Date(parsed.expires_at).getTime() <= Date.now()) {
      window.localStorage.removeItem(STORAGE_PREFIX + centerId);
      return '';
    }
    return parsed.token;
  } catch {
    return '';
  }
}

export interface AccessApplicant { name?: string; email?: string; rut?: string }

export function saveAccessToken(centerId: string, token: string, expiresAt: string, applicant?: AccessApplicant) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_PREFIX + centerId, JSON.stringify({ token, expires_at: expiresAt, applicant }));
}

/** Datos de la solicitud aprobada, para prellenar el contacto de la reserva. */
export function getAccessApplicant(centerId: string): AccessApplicant | null {
  if (typeof window === 'undefined' || !centerId || !getAccessToken(centerId)) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + centerId);
    return raw ? (JSON.parse(raw).applicant ?? null) : null;
  } catch {
    return null;
  }
}

export function clearAccessToken(centerId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_PREFIX + centerId);
}

const BOOKING_PATHS = ['/bookings', '/bookings/mercadopago', '/facility-bookings'];

// Adjunta el token de acceso a las reservas públicas. El centro se toma del
// cuerpo (sport_center_id) o, para espacios, del centro que se está viendo.
api.interceptors.request.use((config) => {
  const url = (config.url || '').split('?')[0];
  if (config.method?.toLowerCase() !== 'post' || !BOOKING_PATHS.includes(url)) return config;
  let body: any = config.data;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return config; }
  }
  if (!body || typeof body !== 'object' || body.access_token) return config;
  const token = getAccessToken(body.sport_center_id || activeCenterId);
  if (token) config.data = { ...body, access_token: token };
  return config;
});

export class AccessApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function errMsg(e: any): Error {
  return new AccessApiError(e?.response?.data?.error || 'No se pudo completar la operación', e?.response?.status);
}

export function isAccessError(e: any): boolean {
  const code = e?.response?.data?.code;
  return code === 'ACCESS_REQUIRED' || code === 'ACCESS_INVALID';
}

const auth = async (getToken: TokenGetter) => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

// --- Público ---

export async function submitAccessRequest(slug: string, payload: {
  rut: string; email: string; name?: string; answers: Record<string, string>; turnstile_token?: string;
}) {
  try {
    const { data } = await api.post(`/sport-centers/slug/${slug}/access/requests`, payload);
    return data as { request_id: string; status: AccessStatus };
  } catch (e) { throw errMsg(e); }
}

export async function requestAccessCode(slug: string, rut: string) {
  try {
    const { data } = await api.post(`/sport-centers/slug/${slug}/access/verify/request`, { rut });
    return data as { verification_id: string; expires_at: string; resend_in_seconds: number; masked_email: string };
  } catch (e) { throw errMsg(e); }
}

export async function confirmAccessCode(slug: string, verificationId: string, code: string) {
  try {
    const { data } = await api.post(`/sport-centers/slug/${slug}/access/verify/confirm`, {
      verification_id: verificationId, code,
    });
    return data as { access_token: string; expires_at: string; applicant: { name?: string; email: string; rut: string } };
  } catch (e) { throw errMsg(e); }
}

export async function validateAccessToken(slug: string, token: string) {
  try {
    const { data } = await api.post(`/sport-centers/slug/${slug}/access/validate`, { access_token: token });
    return data as { valid: boolean; applicant: { name?: string; email: string; rut: string } };
  } catch (e) { throw errMsg(e); }
}

// --- Admin ---

export async function listAccessRequests(getToken: TokenGetter, params: { status?: string; q?: string; page?: number; limit?: number }) {
  try {
    const { data } = await api.get('/admin/access/requests', { ...(await auth(getToken)), params });
    return data as { items: AccessRequest[]; total: number; page: number; limit: number };
  } catch (e) { throw errMsg(e); }
}

export async function getAccessStats(getToken: TokenGetter) {
  try {
    const { data } = await api.get('/admin/access/stats', await auth(getToken));
    return data as Record<AccessStatus, number>;
  } catch (e) { throw errMsg(e); }
}

export async function setAccessStatus(getToken: TokenGetter, id: string, status: AccessStatus, reason?: string) {
  try {
    const { data } = await api.patch(`/admin/access/requests/${id}/status`, { status, reason }, await auth(getToken));
    return data as AccessRequest;
  } catch (e) { throw errMsg(e); }
}

export async function createManualAccess(getToken: TokenGetter, payload: { rut: string; email: string; name?: string }) {
  try {
    const { data } = await api.post('/admin/access/requests', payload, await auth(getToken));
    return data as AccessRequest;
  } catch (e) { throw errMsg(e); }
}

export async function getAccessForm(getToken: TokenGetter) {
  try {
    const { data } = await api.get('/admin/access/form', await auth(getToken));
    return data as { form: AccessForm; is_private: boolean };
  } catch (e) { throw errMsg(e); }
}

export async function saveAccessForm(getToken: TokenGetter, form: AccessForm) {
  try {
    const { data } = await api.put('/admin/access/form', form, await auth(getToken));
    return data as AccessForm;
  } catch (e) { throw errMsg(e); }
}

api.interceptors.response.use(undefined, (error) => {
  if (error?.response?.data?.code === 'ACCESS_INVALID' && typeof window !== 'undefined') {
    if (activeCenterId) clearAccessToken(activeCenterId);
    window.dispatchEvent(new Event('access-changed'));
  }
  return Promise.reject(error);
});
