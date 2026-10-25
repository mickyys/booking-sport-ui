import api from './axiosInstance';

export type CenterStatus = 'active' | 'suspended' | 'blocked';
export type GetToken = () => Promise<string>;

export interface SuperadminCenter {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  rut?: string;
  admin_email?: string;
  status?: CenterStatus | '';
  status_reason?: string;
  status_changed_at?: string;
  is_featured: boolean;
  featured_priority?: number;
  featured_until?: string;
  payment_mode?: 'pay_online' | 'pay_at_center' | '';
  marketplace_fee_percent?: number;
  cancellation_hours?: number;
  retention_percent?: number;
  partial_payment_enabled?: boolean;
  partial_payment_percent?: number;
  mp_user_id?: { mp_user_id?: string } | null;
  onboarding_status?: string;
  courts?: number;
  created_at?: string;
}

export interface CenterStats {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
  featured: number;
  pay_online: number;
}

export interface SuperadminBooking {
  id: string;
  booking_code?: string;
  sport_center_id: string;
  sport_center_name?: string;
  court_name?: string;
  date: string;
  local_date?: string;
  hour: number;
  minutes: number;
  status: string;
  payment_method?: string;
  final_price: number;
  paid_amount: number;
  pending_amount: number;
  guest_details?: { name: string; email: string; phone: string };
  user_id?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

async function cfg(getToken: GetToken, extra: object = {}) {
  const token = await getToken();
  // DEPURACIÓN: el backend valida el ACCESS token, no el ID token.
  // Decodificamos su payload para ver si trae el claim de roles.
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const roleKeys = Object.keys(payload).filter((k) => k.endsWith('/roles') || k === 'roles');
    const roles = roleKeys.flatMap((k) => (Array.isArray(payload[k]) ? payload[k] : [payload[k]]));
    console.log('[superadminApi] access token', {
      sub: payload.sub,
      roles,
      roleClaims: roleKeys,
    });
  } catch {
    console.log('[superadminApi] no se pudo decodificar el access token');
  }
  return { headers: { Authorization: `Bearer ${token}` }, ...extra };
}

const clean = (p: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const sa = {
  stats: async (t: GetToken): Promise<CenterStats> =>
    (await api.get('/superadmin/sport-centers/stats', await cfg(t))).data,

  listCenters: async (t: GetToken, params: Record<string, unknown>): Promise<Paged<SuperadminCenter>> =>
    (await api.get('/superadmin/sport-centers', await cfg(t, { params: clean(params) }))).data,

  getCenter: async (t: GetToken, id: string): Promise<{ center: SuperadminCenter; admin_count: number }> =>
    (await api.get(`/superadmin/sport-centers/${id}`, await cfg(t))).data,

  createCenter: async (t: GetToken, body: Record<string, unknown>) =>
    (await api.post('/superadmin/sport-centers', body, await cfg(t))).data as { id: string; slug: string; name: string },

  updateSettings: async (t: GetToken, id: string, body: Record<string, unknown>) =>
    (await api.patch(`/superadmin/sport-centers/${id}/settings`, body, await cfg(t))).data,

  setStatus: async (t: GetToken, id: string, status: CenterStatus, reason: string) =>
    (await api.put(`/superadmin/sport-centers/${id}/status`, { status, reason }, await cfg(t))).data,

  setFeatured: async (t: GetToken, id: string, body: { is_featured: boolean; priority: number; until?: string | null }) =>
    (await api.put(`/superadmin/sport-centers/${id}/featured`, body, await cfg(t))).data,

  listBookings: async (t: GetToken, params: Record<string, unknown>): Promise<Paged<SuperadminBooking>> =>
    (await api.get('/superadmin/bookings', await cfg(t, { params: clean(params) }))).data,

  exportBookings: async (t: GetToken, params: Record<string, unknown>): Promise<Blob> =>
    (await api.get('/superadmin/bookings/export', await cfg(t, { params: clean(params), responseType: 'blob' }))).data,

  listAudit: async (t: GetToken, params: Record<string, unknown>): Promise<Paged<AuditLog>> =>
    (await api.get('/superadmin/audit', await cfg(t, { params: clean(params) }))).data,
};

export const apiError = (e: unknown, fallback = 'Ocurrió un error'): string => {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  return err?.response?.data?.error || err?.message || fallback;
};
