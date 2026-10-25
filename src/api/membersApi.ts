const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export type DiscountType = 'PERCENT' | 'FIXED';
export type DiscountScopeMode = 'category' | 'spaces' | 'all';
export type DiscountPeriod = 'total' | 'day' | 'week' | 'fortnight' | 'month' | 'year';
export type SpaceCategory = 'cancha' | 'quincho' | 'sede' | 'piscina';
export type MemberStatus = 'active' | 'suspended' | 'expired';

export interface DiscountValue {
  type: DiscountType;
  value: number;
}

export interface DiscountScope {
  mode: DiscountScopeMode;
  categories?: SpaceCategory[];
  space_ids?: string[];
}

export interface UsageLimit {
  max_uses: number;
  max_uses_per_user: number;
  period: DiscountPeriod;
}

export interface MembershipPlan {
  id: string;
  sport_center_id: string;
  name: string;
  description?: string;
  discount: DiscountValue;
  scope: DiscountScope;
  usage_limit: UsageLimit;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  sport_center_id: string;
  plan_id: string;
  plan_name?: string;
  document_number: string;
  email: string;
  name: string;
  phone?: string;
  status: MemberStatus;
  valid_from?: string | null;
  valid_to?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type DiscountDerivedStatus = 'scheduled' | 'available' | 'exhausted' | 'expired' | 'voided';

export interface DiscountCode {
  id: string;
  sport_center_id: string;
  code: string;
  batch_id?: string;
  discount: DiscountValue;
  scope: DiscountScope;
  usage_limit: UsageLimit;
  min_amount?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  status: 'active' | 'voided';
  used_count: number;
  derived_status: DiscountDerivedStatus;
  created_at?: string;
}

export interface DiscountUsage {
  id: string;
  source: 'plan' | 'code';
  code?: string;
  status: 'reserved' | 'confirmed' | 'released';
  base_amount: number;
  discount_amount: number;
  final_amount: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  booking_code?: string;
  created_at: string;
}

export interface PriceQuote {
  base_price: number;
  discount_total: number;
  final_price: number;
  applied: Array<{
    kind: 'membership' | 'code';
    id: string;
    code?: string;
    label: string;
    type: string;
    value: number;
    amount: number;
  }>;
  rejected: Array<{ kind: string; code?: string; reason: string }>;
  member?: { id: string; name: string; plan_id: string; plan_name: string };
}

export interface VerificationRequestResult {
  verification_id: string;
  expires_at: string;
  resend_in_seconds: number;
}

export interface VerificationConfirmResult {
  member_token: string;
  expires_at: string;
  member: { id: string; name: string; plan_id: string; plan_name: string };
}

type TokenGetter = (options?: any) => Promise<string>;

async function request<T>(path: string, init: RequestInit = {}, getToken?: TokenGetter): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (getToken) {
    headers.Authorization = `Bearer ${await getToken()}`;
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'No se pudo completar la operación');
  }
  return body as T;
}

// --- Público ---

export function quoteBooking(payload: {
  court_id: string;
  date: string;
  hour: number;
  minutes?: number;
  duration_minutes?: number;
  discount_code?: string;
  member_token?: string;
  email?: string;
  device_id?: string;
}): Promise<PriceQuote> {
  return request<PriceQuote>('/pricing/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function requestMemberVerification(payload: {
  center_id?: string;
  center_slug?: string;
  document: string;
  email: string;
}): Promise<VerificationRequestResult> {
  return request<VerificationRequestResult>('/members/verify/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmMemberVerification(payload: {
  verification_id: string;
  code: string;
}): Promise<VerificationConfirmResult> {
  return request<VerificationConfirmResult>('/members/verify/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// --- Administración ---

export function listPlans(getToken: TokenGetter): Promise<{ plans: MembershipPlan[] }> {
  return request('/admin/membership/plans', {}, getToken);
}

export function createPlan(getToken: TokenGetter, payload: Partial<MembershipPlan>): Promise<MembershipPlan> {
  return request('/admin/membership/plans', { method: 'POST', body: JSON.stringify(payload) }, getToken);
}

export function updatePlan(getToken: TokenGetter, id: string, payload: Partial<MembershipPlan>): Promise<MembershipPlan> {
  return request(`/admin/membership/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, getToken);
}

export function deletePlan(getToken: TokenGetter, id: string): Promise<{ status: string }> {
  return request(`/admin/membership/plans/${id}`, { method: 'DELETE' }, getToken);
}

export function listMembers(getToken: TokenGetter): Promise<{ members: Member[] }> {
  return request('/admin/members', {}, getToken);
}

export function createMember(getToken: TokenGetter, payload: Partial<Member>): Promise<Member> {
  return request('/admin/members', { method: 'POST', body: JSON.stringify(payload) }, getToken);
}

export function updateMember(getToken: TokenGetter, id: string, payload: Partial<Member>): Promise<Member> {
  return request(`/admin/members/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, getToken);
}

export function deleteMember(getToken: TokenGetter, id: string): Promise<{ status: string }> {
  return request(`/admin/members/${id}`, { method: 'DELETE' }, getToken);
}

export function listDiscountCodes(getToken: TokenGetter): Promise<{ codes: DiscountCode[] }> {
  return request('/admin/discount-codes', {}, getToken);
}

export function createDiscountCode(getToken: TokenGetter, payload: Record<string, unknown>): Promise<DiscountCode> {
  return request('/admin/discount-codes', { method: 'POST', body: JSON.stringify(payload) }, getToken);
}

export function createDiscountBatch(
  getToken: TokenGetter,
  payload: Record<string, unknown>,
): Promise<{ codes: DiscountCode[]; count: number }> {
  return request('/admin/discount-codes/batch', { method: 'POST', body: JSON.stringify(payload) }, getToken);
}

export function voidDiscountCode(getToken: TokenGetter, id: string): Promise<{ status: string }> {
  return request(`/admin/discount-codes/${id}/void`, { method: 'POST' }, getToken);
}

export function voidDiscountBatch(getToken: TokenGetter, batchId: string): Promise<{ status: string }> {
  return request(`/admin/discount-codes/batches/${batchId}/void`, { method: 'POST' }, getToken);
}

export function listDiscountUsages(getToken: TokenGetter, codeId?: string): Promise<{ usages: DiscountUsage[] }> {
  const query = codeId ? `?code_id=${encodeURIComponent(codeId)}` : '';
  return request(`/admin/discount-usages${query}`, {}, getToken);
}

export function exportDiscountCodesUrl(): string {
  return `${API_URL}/admin/discount-codes/export`;
}
