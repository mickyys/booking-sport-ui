import api from './axiosInstance';
import { SportCenter, CenterTimeSlot, Tenant, ScheduleRule, ScheduleException, Block, ScheduleSource } from '../types';

export const getTenantByHost = async (host: string) => {
  const response = await api.get(`/tenants/host/${encodeURIComponent(host)}`);
  return response.data.data as Tenant;
};

export const getUserCancelledBookings = async (token: string, page = 1, limit = 5) => {
  const response = await api.get('/bookings/my-cancelled', {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Vincula a la cuenta las reservas hechas como invitado con el correo del usuario.
export const claimGuestBookings = async (token: string): Promise<number> => {
  const response = await api.post('/bookings/claim', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data?.claimed || 0;
};

export const getMyPhone = async (token: string): Promise<string> => {
  const response = await api.get('/users/me/phone', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data?.phone || '';
};

export const saveMyPhone = async (token: string, phone: string): Promise<string> => {
  const response = await api.put('/users/me/phone', { phone }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data?.phone || '';
};

export const getSportCenters = async (page = 1, limit = 50) => {
  const response = await api.get('/sport-centers', { params: { page, limit } });
  return response.data;
};

export const getSportCenterBySlug = async (slug: string) => {
  const response = await api.get(`/sport-centers/slug/${slug}`);
  return response.data;
};

export const getSportCenterSchedules = async (centerId: string) => {
  const response = await api.get(`/sport-centers/${centerId}/schedules`);
  return response.data;
};

// Facilities (quinchos, sedes, piscinas): llegan incluidas en
// GET /sport-centers/slug/{slug} (ver useBookingStore.facilitiesBySlug).

export const createFacilityInquiry = async (data: {
  facility_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message?: string;
  month?: number;
  days?: number[];
  dates?: string[];
  date?: string;
  slot_kind?: string;
  total_price?: number;
}) => {
  const response = await api.post('/facilities/inquiries', data);
  return response.data;
};

export const updateSportCenterSchedules = async (centerId: string, data: {
  default_schedule: CenterTimeSlot;
  schedule_overrides: Record<number, CenterTimeSlot>;
  active_days: number[];
}, token: string) => {
  const response = await api.put(`/sport-centers/${centerId}/schedules`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getMySportCenter = async (token: string) => {
  const response = await api.get('/admin/my-sport-center', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ===== Configuración de horarios por espacio (reglas / excepciones / bloqueos) =====

export const getSpaceSchedule = async (
  spaceId: string,
  token: string,
): Promise<{ rules: ScheduleRule[]; source: ScheduleSource }> => {
  const response = await api.get(`/admin/spaces/${spaceId}/schedule`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return {
    rules: response.data.rules || [],
    source: (response.data.source as ScheduleSource) || 'none',
  };
};

export const saveSpaceSchedule = async (spaceId: string, rules: ScheduleRule[], token: string): Promise<ScheduleRule[]> => {
  const response = await api.put(`/admin/spaces/${spaceId}/schedule`, { rules }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.rules || [];
};

export const getSpaceExceptions = async (spaceId: string, token: string): Promise<ScheduleException[]> => {
  const response = await api.get(`/admin/spaces/${spaceId}/schedule/exceptions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.exceptions || [];
};

export const createSpaceException = async (spaceId: string, exception: ScheduleException, token: string): Promise<ScheduleException> => {
  const response = await api.post(`/admin/spaces/${spaceId}/schedule/exceptions`, exception, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.exception;
};

export const updateSpaceException = async (spaceId: string, id: string, exception: ScheduleException, token: string): Promise<ScheduleException> => {
  const response = await api.put(`/admin/spaces/${spaceId}/schedule/exceptions/${id}`, exception, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.exception;
};

export const deleteSpaceException = async (spaceId: string, id: string, token: string): Promise<void> => {
  await api.delete(`/admin/spaces/${spaceId}/schedule/exceptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getSpaceBlocks = async (spaceId: string, token: string): Promise<Block[]> => {
  const response = await api.get(`/admin/spaces/${spaceId}/blocks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.blocks || [];
};

export const createSpaceBlock = async (spaceId: string, block: Block, token: string): Promise<Block> => {
  const response = await api.post(`/admin/spaces/${spaceId}/blocks`, block, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.block;
};

export const deleteSpaceBlock = async (spaceId: string, id: string, token: string): Promise<void> => {
  await api.delete(`/admin/spaces/${spaceId}/blocks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Disponibilidad pública de un espacio (facilities: quincho/sede/piscina)
export const getSpaceAvailability = async (spaceId: string, date: string) => {
  const response = await api.get(`/spaces/${spaceId}/availability`, {
    params: { date },
  });
  return response.data?.data;
};

export const getSpaceAvailabilityRange = async (spaceId: string, from: string, to: string) => {
  const response = await api.get(`/spaces/${spaceId}/availability`, {
    params: { from, to },
  });
  return response.data?.data as Record<string, { closed: boolean; blocked: boolean; booked?: boolean; has_rules: boolean }>;
};

export interface FacilityPaymentOptions {
  online: boolean;
  venue: boolean;
  default: 'mercadopago' | 'venue' | '';
  partial_enabled: boolean;
  partial_percent: number;
  price_per_day: number;
  capacity: number;
}

export const getFacilityPaymentOptions = async (spaceId: string): Promise<FacilityPaymentOptions> => {
  const response = await api.get(`/spaces/${spaceId}/payment-options`);
  return response.data;
};

export interface FacilityBookingDay {
  id: string;
  booking_code: string;
  space_id: string;
  space_name: string;
  space_type: 'sede' | 'piscina';
  sport_center_name: string;
  local_date: string;
  guests: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  payment_method: 'mercadopago' | 'venue';
  price: number;
  paid_amount: number;
  pending_amount: number;
  is_partial_payment: boolean;
  created_at: string;
}

export interface CreateFacilityBookingResult {
  booking_code: string;
  status: 'pending' | 'confirmed';
  init_point?: string;
  total: number;
  amount_to_pay: number;
  bookings: FacilityBookingDay[];
}

export const createFacilityBooking = async (data: {
  space_id: string;
  dates: string[];
  guests: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method?: 'mercadopago' | 'venue';
  partial?: boolean;
}): Promise<CreateFacilityBookingResult> => {
  const response = await api.post('/facility-bookings', data);
  return response.data;
};

export const getFacilityBookingByCode = async (code: string): Promise<FacilityBookingDay[]> => {
  const response = await api.get(`/bookings/code/${code}`);
  return response.data?.bookings || [];
};

export const getAdminFacilityBookings = async (token: string): Promise<FacilityBookingDay[]> => {
  const response = await api.get('/admin/facility-bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.bookings || [];
};

export const cancelAdminFacilityBooking = async (id: string, token: string) => {
  const response = await api.post(`/admin/facility-bookings/${id}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Recurring Reservation API
export const createRecurringReservation = async (data: any, token: string) => {
  const response = await api.post('/admin/recurring', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getRecurringReservation = async (id: string, token: string) => {
  const response = await api.get(`/admin/recurring/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getRecurringReservationsByCenter = async (token: string) => {
  const response = await api.get('/admin/recurring', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getRecurringReservationsByCourt = async (courtId: string, token: string) => {
  const response = await api.get(`/admin/recurring/court/${courtId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const cancelRecurringReservation = async (id: string, token: string, cancelledBy = 'admin', reason = '') => {
  const response = await api.delete(`/admin/recurring/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { cancelled_by: cancelledBy, reason }
  });
  return response.data;
};

export const cancelRecurringDate = async (id: string, date: string, token: string) => {
  const response = await api.post(`/admin/recurring/${id}/cancel-date`, { date }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export interface GoogleReview {
  author: string;
  author_photo?: string;
  author_url?: string;
  rating: number;
  text: string;
  relative_time?: string;
}

export interface GoogleReviewsData {
  rating: number;
  total_reviews: number;
  maps_url?: string;
  reviews: GoogleReview[];
}

export const getGoogleReviews = async (slug: string): Promise<GoogleReviewsData | null> => {
  const response = await api.get(`/sport-centers/slug/${encodeURIComponent(slug)}/reviews`);
  return response.data?.available ? (response.data.google as GoogleReviewsData) : null;
};
