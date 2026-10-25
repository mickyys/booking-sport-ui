import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { SportCenter, Court, CourtWithSchedule, Booking, BookingDTO, RecurringReservation, CreateRecurringReservationDTO, Facility } from '../types';
import api from '../api/axiosInstance';
import { getUserCancelledBookings, createRecurringReservation as createRecurringApi, cancelRecurringReservation as cancelRecurringApi, cancelRecurringDate as cancelRecurringDateApi, getRecurringReservationsByCenter } from '../api/bookingApi';
import { mapBooking } from '../mapper/mapBooking';
import { format, addDays } from 'date-fns';
import { normalizeCoordinates } from '../utils/geo';
import { todaySantiagoKey } from '../lib/santiago';

// Sólo la última petición de schedules en curso puede escribir en el store.
// Evita que una respuesta tardía (centro/fecha equivocados) pise la respuesta correcta.
let schedulesRequestId = 0;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1759210720456-c9814f721479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwc29jY2VyJTIwZmllbGQlMjBuaWdodCUyMGxpZ2h0c3xlbnwxfHx8fDE3NzQ4OTgwODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

interface BookingState {
  sportCenters: SportCenter[];
  courts: Court[];
  schedules: CourtWithSchedule[];
  weeklySchedules: Record<string, any[]>;
  myBookings: any[];
  cancelledBookings: any[];
  isCancelledLoading: boolean;
  currentBooking: Booking | null;
  selectedCenterId: string | null;
  apiUrl: string | null;
  isLoading: boolean;
  error: string | null;
  adminCourts: any[];
  adminFacilities: any[];
  adminSpaces: any[];
  adminDashboardData: any | null;
  recurringSeries: any[];
  sportCenterBySlug: SportCenter | null;
  /** Facilities (quincho/sede/piscina) cacheadas por slug; llegan con GET /sport-centers/slug/{slug}. */
  facilitiesBySlug: Record<string, Facility[]>;
  cities: string[];
  /** true cuando el filtro por radio no dejó centros y el backend devolvió los más cercanos. */
  usedRadiusFallback: boolean;
  recurringReservations: RecurringReservation[];


  // Actions
  fetchSportCenters: (filters?: { page?: number; limit?: number; name?: string; city?: string; date?: string; hour?: number; lat?: number; lng?: number; radius?: number }) => Promise<void>;
  fetchCities: () => Promise<string[]>;
  fetchCourts: () => Promise<void>;
  fetchSchedules: (centerId: string, date?: string) => Promise<void>;
  fetchAdminSchedules: (centerId: string, date: string | undefined, getToken: (options?: any) => Promise<string>) => Promise<any[]>;
  fetchAdminSchedulesRange: (centerId: string, from: string, to: string, getToken: (options?: any) => Promise<string>) => Promise<Record<string, any[]> | null>;
  fetchMyBookings: (getToken: (options?: any) => Promise<string>, isOld?: boolean) => Promise<void>;
  fetchCancelledBookings: (getToken: (options?: any) => Promise<string>, page?: number, limit?: number) => Promise<any[]>;
  fetchConfirmedCount: (getToken: (options?: any) => Promise<string>) => Promise<number>;
  fetchBookingDetail: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<any>;
  fetchBookingByCode: (code: string) => Promise<any>;
  resetCurrentBooking: () => void;
  createMercadoPagoPayment: (bookingData: any) => Promise<{ init_point: string; booking_code: string }>;
  mockConfirmPayment: (code: string, status: string) => Promise<any>;
  cancelBooking: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  setSelectedCenterId: (id: string | null) => void;
  initialize: () => Promise<void>;
  fetchAdminCourts: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchAdminFacilities: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchAdminSpaces: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  createAdminSpace: (spaceData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  updateAdminSpace: (spaceId: string, spaceData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  deleteAdminSpace: (spaceId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  createAdminFacility: (facilityData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  updateAdminFacility: (facilityId: string, facilityData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  deleteAdminFacility: (facilityId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchAdminDashboard: (getToken: (options?: any) => Promise<string>, page?: number, limit?: number, date?: string, name?: string, code?: string, status?: string) => Promise<void>;
  fetchRecurringSeries: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  createAdminCourt: (courtData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  updateAdminCourt: (courtId: string, courtData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  deleteAdminCourt: (courtId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAdminSchedule: (courtId: string, schedule: any[], getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAdminScheduleSlot: (courtId: string, slot: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAgentSportCenter?: (id: string, centerData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  createBooking: (bookingData: any) => Promise<any>;
  createInternalBooking: (bookingData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  deleteBooking: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  rescheduleBooking: (bookingId: string, data: { date: string; hour: number; minutes: number; court_id?: string }, getToken: (options?: any) => Promise<string>) => Promise<any>;
  payBalance: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  undoPayBalance: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  deleteSeries: (seriesId: string, getToken: (options?: any) => Promise<string>, reason?: string) => Promise<void>;
  fetchSportCenterBySlug: (slug: string) => Promise<SportCenter | null>;
  updateSportCenter: (id: string, centerData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateSportCenterSettings: (id: string, centerData: { slug?: string; cancellation_hours?: number; retention_percent?: number; partialPaymentEnabled?: boolean; partialPaymentPercent?: number; payment_mode?: 'pay_online' | 'pay_at_center'; image_url?: string; marketplace_fee_percent?: number; address?: string; city?: string; coordinates?: { lat: number; lng: number }; google_place_id?: string; branding?: { name?: string; logo_url?: string; primary_color?: string; primary_dark?: string; accent?: string; nav_bg?: string; hero_gradient?: string } }, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateSportCenterOnboarding: (data: { step?: number; nombre?: string; rut?: string; email?: string; direccion?: string; telefono?: string; templates?: { tipo: string; cantidad: number; cancha?: boolean; rules?: any[]; price_all_day?: number; price_per_day?: number; price_per_month?: number }[]; payment_mode?: string; image_url?: string; first_month_free?: boolean; finalize?: boolean }, getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchSportCenterByID: (id: string, getToken: (options?: any) => Promise<string>) => Promise<any>;
  createRecurringReservation: (data: CreateRecurringReservationDTO, getToken: (options?: any) => Promise<string>) => Promise<void>;
  cancelRecurringReservation: (id: string, getToken: (options?: any) => Promise<string>, reason?: string) => Promise<void>;
  cancelRecurringDate: (id: string, date: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchRecurringReservationsByCenter: (getToken: (options?: any) => Promise<string>) => Promise<void>;
}

export const useBookingStore = create<BookingState, [["zustand/persist", Partial<BookingState>]]>(
  persist(
    (set, get) => ({
    fetchCancelledBookings: async (getToken: (options?: any) => Promise<string>, page = 1, limit = 5) => {
      set({ isCancelledLoading: true });
      try {
        const token = await getToken({
          authorizationParams: {
            audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
            scope: "openid profile email"
          }
        });
        const result = await getUserCancelledBookings(token, page, limit);
        // Mapeo de snake_case a camelCase si es necesario
        const formatted = (result.data || []).map((b: any) => ({
          ...b,
          sportCenterName: b.sport_center_name,
          courtName: b.court_name,
          courtId: b.court_id,
          centerId: b.sport_center_id,
          paymentMethod: b.booking_detail.payment_method,
          paidAmount: b.booking_detail.paid_amount,
          pendingAmount: b.booking_detail.pending_amount,
          createdAt: b.created_at

        }));
        set({ error: null, cancelledBookings: formatted });
        return formatted;
      } catch (err) {
        set({ error: 'Failed to fetch cancelled bookings', cancelledBookings: [] });
        return [];
      } finally {
        set({ isCancelledLoading: false });
      }
    },
  sportCenters: [],
  cities: [],
  usedRadiusFallback: false,
  courts: [],
  schedules: [],
  weeklySchedules: {},
  myBookings: [],
  cancelledBookings: [],
  isCancelledLoading: false,
  currentBooking: null,
  selectedCenterId: null,
  apiUrl: null,
  isLoading: false,
  error: null,
  adminCourts: [],
  adminFacilities: [],
  adminSpaces: [],
  adminDashboardData: null,
  recurringSeries: [],
  sportCenterBySlug: null,
  facilitiesBySlug: {},
  recurringReservations: [],

  fetchRecurringSeries: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { data } = await api.get(`/admin/bookings/series`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ recurringSeries: data.data || [], error: null });
    } catch (err) {
      console.error("Error fetching series:", err);
      set({ error: 'Failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedCenterId: (id: string | null) => {
    set({ selectedCenterId: id });
    if (id) {
      // Fecha explícita: sin ella el backend devuelve "hoy" aunque el usuario
      // esté viendo otro día, y esa respuesta tardía pisaba la del día correcto.
      get().fetchSchedules(id, todaySantiagoKey());
    }
  },

  fetchMyBookings: async (getToken: (options?: any) => Promise<string>, isOld: boolean = false) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { data } = await api.get(`/bookings/my-bookings${isOld ? '?old=true' : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Mapeo de snake_case (Backend) a camelCase (Frontend)
      const formattedBookings = (data.data || []).map((b: any) => ({
        ...b,
        sportCenterName: b.sport_center_name,
        courtName: b.court_name,
        courtId: b.court_id,
        centerId: b.sport_center_id,
        paymentMethod: b.payment_method || 'internal',
        paidAmount: b.paid_amount,
          pendingAmount: b.pending_amount,
          isPartialPayment: b.is_partial_payment,
          partialPaymentPaid: b.partial_payment_paid,
        createdAt: b.created_at
      }));
      set({ myBookings: formattedBookings, error: null });
    } catch (err) {
      set({ error: 'Failed to fetch your bookings' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConfirmedCount: async (getToken: (options?: any) => Promise<string>) => {
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { data } = await api.get('/bookings/confirmed/count', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data.count || 0;
    } catch (err) {
      console.error("Error fetching confirmed count:", err);
      return 0;
    }
  },

  fetchBookingDetail: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { data } = await api.get(`/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data;
    } catch (err) {
      console.error("Error fetching booking detail:", err);
      // Solo actualizamos el error en el store si realmente queremos que afecte el estado global
      // set({ error: 'Failed to fetch booking detail' });
      throw err;
    } finally {
      // Evitamos llamar a set si no hubo cambios reales que requieran un re-render global innecesario
      // set({ isLoading: false });
    }
  },

  fetchBookingByCode: async (code: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/bookings/code/${code}`);
      if (data?.type === 'facility') {
        // Reserva de sede/piscina: el estado de todos los días se resume en uno solo.
        const days: Array<{
          status: string;
          paid_amount: number;
          pending_amount: number;
          is_partial_payment: boolean;
          price: number;
          local_date: string;
          guests?: number;
          space_name?: string;
          space_type?: string;
          sport_center_name?: string;
          payment_method?: string;
        }> = data.bookings || [];
        const status = days.some((d) => d.status === 'confirmed')
          ? 'confirmed'
          : days.some((d) => d.status === 'pending')
            ? 'pending'
            : days[0]?.status || 'cancelled';
        const first = days[0];
        set({
          currentBooking: {
            id: code,
            booking_code: code,
            status,
            isFacility: true,
            space_type: first?.space_type,
            court_name: first?.space_name,
            sport_center_name: first?.sport_center_name,
            payment_method: first?.payment_method,
            guests: first?.guests,
            facilityDates: days.map((d) => d.local_date),
            price: days.reduce((s, d) => s + (d.price || 0), 0),
            paidAmount: days.reduce((s, d) => s + d.paid_amount, 0),
            pendingAmount: days.reduce((s, d) => s + d.pending_amount, 0),
            isPartialPayment: !!first?.is_partial_payment,
          } as any,
          error: null,
        });
        return data;
      }
      // Return same shape as fetchBookingDetail (backend returns booking_detail + metadata)
      // Store both booking detail and cancellation policy
      set({ 
        currentBooking: { 
          ...data.booking_detail, 
          paidAmount: data.booking_detail.paid_amount,
          pendingAmount: data.booking_detail.pending_amount,
          isPartialPayment: data.booking_detail.is_partial_payment,
          cancellationPolicy: data.cancellation_policy,
          canCancel: data.can_cancel,
          refundPercentage: data.refund_percentage,
          maxRefundAmount: data.max_refund_amount,
        }, 
        error: null 
      });
      return data;
    } catch (err) {
      console.error("Error fetching booking by code:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  resetCurrentBooking: () => {
    set({ currentBooking: null, error: null });
  },

  createMercadoPagoPayment: async (bookingData: any) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/bookings/mercadopago', bookingData);
      return data;
    } catch (err) {
      console.error("Error creating MercadoPago payment:", err);
      set({ error: 'Failed to initiate payment' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  mockConfirmPayment: async (code: string, status: string) => {
    const { data } = await api.post('/bookings/mercadopago/mock-confirm', { code, status });
    return data;
  },

  createBooking: async (bookingData: any) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/bookings', bookingData);
      set({ currentBooking: data, error: null });
      return data;
    } catch (err) {
      console.error("Error creating booking:", err);
      set({ error: 'Failed to create booking' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelBooking: async (bookingId: string,  getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        }
      });
      await api.post(`/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh bookings after cancellation
      await get().fetchMyBookings(getToken);
      set({ error: null });
    } catch (err) {
      console.error("Error cancelling booking:", err);
      set({ error: 'Failed to cancel the booking' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSeries: async (seriesId: string, getToken: (options?: any) => Promise<string>, reason = '') => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        },
      });
      await api.delete(`/admin/bookings/series/${seriesId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: { reason }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error deleting series:", err);
      set({ error: 'Failed to delete the series' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSportCenters: async (filters?: { page?: number; limit?: number; name?: string; city?: string; date?: string; hour?: number; lat?: number; lng?: number; radius?: number }) => {
    set({ isLoading: true });
    try {
      const params: any = {};
      if (filters) {
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.name) params.name = filters.name;
        if (filters.city) params.city = filters.city;
        if (filters.date) params.date = filters.date;
        if (typeof filters.hour === 'number') params.hour = String(filters.hour);
        if (typeof filters.lat === 'number') params.lat = String(filters.lat);
        if (typeof filters.lng === 'number') params.lng = String(filters.lng);
        if (typeof filters.radius === 'number') params.radius = String(filters.radius);
      }

      let data;
      try {
        const response = await api.get('/sport-centers', { params });
        data = response.data;
      } catch (err) {
        console.warn('API failed');
        data = { data: [] };
      }

      const centersData = data.data || data;
      const centers: SportCenter[] = centersData
        .filter((c: any) => c.onboarding_status !== 'pending')
        .map((c: any) => {
        // Preserve original backend fields (availableHours, available_dates, city, etc.)
        // while normalizing a few known fields used across the UI.
        return {
          ...c,
          id: c.id || c._id,
          name: c.name,
          slug: c.slug || '',
          location: c.address,
          address: c.address,
          courts: c.courts ?? c.courts_count ?? (Array.isArray(c.courts) ? c.courts.length : undefined),
          contact: c.contact || { phone: '', email: '' },
          image: c.image_url || c.image || FALLBACK_IMAGE,
          cancellationHours: c.cancellation_hours,
          retentionPercent: c.retention_percent,
        partialPaymentEnabled: c.partial_payment_enabled,
        partialPaymentPercent: c.partial_payment_percent,
          services: c.services || [],
          isFeatured: c.is_featured,
          distanceKm: c.distance_km ?? (c.distance != null ? c.distance / 1000 : undefined),
          coordinates: normalizeCoordinates(c.coordinates)
        } as SportCenter;
      });

      set({ sportCenters: centers, usedRadiusFallback: !!data?.used_radius_fallback, error: null });

      if (centers.length > 0 && !get().selectedCenterId) {
        get().setSelectedCenterId(centers[0].id);
      }
    } catch (err) {
      console.error('Error fetching sport centers:', err);
      set({ error: 'Failed to fetch sport centers', usedRadiusFallback: false });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCities: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/cities');
      // backend returns { cities: [...] }
      const cities = data.cities || data.data || data || [];
      const normalized = (Array.isArray(cities) ? cities.map((c: any) => (typeof c === 'string' ? c : String(c))).filter(Boolean) : []);
      set({ cities: normalized, error: null });
      return normalized;
    } catch (err) {
      console.error('Error fetching cities:', err);
      set({ error: 'Failed to fetch cities' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSportCenterBySlug: async (slug: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/sport-centers/slug/${slug}`);
      const c = data.center || data;
      const center: SportCenter = {
        id: c.id || c._id,
        name: c.name,
        slug: c.slug,
        city: c.city,
        location: c.address,
        address: c.address,
        courts: c.courts ?? c.courts_count ?? (Array.isArray(c.courts) ? c.courts.length : undefined),
        contact: c.contact || { phone: '', email: '' }, 
        image: c.image_url || c.image || FALLBACK_IMAGE,
        cancellationHours: c.cancellation_hours,
        retentionPercent: c.retention_percent,
        partialPaymentEnabled: c.partial_payment_enabled,
        partialPaymentPercent: c.partial_payment_percent,
        services: c.services || [],
        coordinates: normalizeCoordinates(c.coordinates),
        googlePlaceId: c.google_place_id || undefined,
      };
      const facilities: Facility[] = Array.isArray(data.facilities) ? data.facilities : [];
      set({
        sportCenterBySlug: center,
        selectedCenterId: center.id,
        facilitiesBySlug: { ...get().facilitiesBySlug, [slug]: facilities },
        error: null,
      });
      return center;
    } catch (err) {
      console.error("Error fetching sport center by slug:", err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSportCenter: async (id: string, centerData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      await api.put(`/admin/sport-centers/${id}`, centerData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh local data
      await get().fetchSportCenters();
    } catch (err) {
      console.error("Error updating sport center:", err);
      set({ error: 'Failed to update sport center' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSportCenterSettings: async (id: string, settingsData: { slug?: string; cancellation_hours?: number; retention_percent?: number; partialPaymentEnabled?: boolean; partialPaymentPercent?: number; payment_mode?: 'pay_online' | 'pay_at_center'; image_url?: string; marketplace_fee_percent?: number; address?: string; city?: string; coordinates?: { lat: number; lng: number }; google_place_id?: string; branding?: { name?: string; logo_url?: string; primary_color?: string; primary_dark?: string; accent?: string; nav_bg?: string; hero_gradient?: string } }, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const filteredData: any = {};
      if (settingsData.image_url) filteredData.image_url = settingsData.image_url;
      if (settingsData.cancellation_hours !== undefined) filteredData.cancellation_hours = settingsData.cancellation_hours;
      if (settingsData.retention_percent !== undefined) filteredData.retention_percent = settingsData.retention_percent;
      if (settingsData.partialPaymentEnabled !== undefined) filteredData.partial_payment_enabled = settingsData.partialPaymentEnabled;
      if (settingsData.partialPaymentPercent !== undefined) filteredData.partial_payment_percent = settingsData.partialPaymentPercent;
      if (settingsData.marketplace_fee_percent !== undefined) filteredData.marketplace_fee_percent = settingsData.marketplace_fee_percent;
      if (settingsData.payment_mode !== undefined) filteredData.payment_mode = settingsData.payment_mode;
      if (settingsData.slug) filteredData.slug = settingsData.slug;
      if (settingsData.address !== undefined) filteredData.address = settingsData.address;
      if (settingsData.city !== undefined) filteredData.city = settingsData.city;
      if (settingsData.coordinates !== undefined && settingsData.coordinates.lat !== 0 && settingsData.coordinates.lng !== 0) filteredData.coordinates = settingsData.coordinates;
      if (settingsData.google_place_id !== undefined) filteredData.google_place_id = settingsData.google_place_id;
      if (settingsData.branding) filteredData.branding = settingsData.branding;
      await api.patch(`/admin/sport-centers/${id}/settings`, filteredData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await get().fetchSportCenters();
    } catch (err) {
      console.error("Error updating sport center settings:", err);
      set({ error: 'Failed to update sport center settings' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSportCenterOnboarding: async (data, getToken) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      await api.put('/admin/my-sport-center/onboarding', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error("Error updating onboarding:", err);
      set({ error: 'Failed to update onboarding' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSportCenterByID: async (id: string, getToken: (options?: any) => Promise<string>) => {
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      // Si el ID es especial o estamos en admin, podemos usar el nuevo endpoint
      const url = id === 'my' || !id ? `/admin/my-sport-center` : `/admin/sport-centers/${id}`;

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const center = response.data.center;
      if (center) {
        return {
          ...center,
          partialPaymentEnabled: center.partial_payment_enabled,
          partialPaymentPercent: center.partial_payment_percent,
          cancellationHours: center.cancellation_hours,
          retentionPercent: center.retention_percent,
          image_url: center.image_url
        };
      }
      return center;
    } catch (err) {
      console.error("Error fetching sport center by ID:", err);
      return null;
    }
  },

  fetchCourts: async () => {
    try {
      const limit = 500;
      const allCourts: Court[] = [];
      let page = 1;
      let totalPages = 1;

      // El backend pagina con limit=10 por defecto: hay que recorrer todas las
      // páginas o los centros creados después quedarían sin canchas.
      do {
        const response = await api.get(`/courts?page=${page}&limit=${limit}`);
        const data = response.data;
        const courtsData: any[] = data.data || data || [];

        courtsData.forEach((c: any) => {
          allCourts.push({
            id: c.id || c._id,
            name: c.name,
            shortName: c.name.split(' ')[0],
            type: c.description || 'Pasto Sintético',
            image: c.image || '/images/cancha1.jpeg',
            centerId: c.sport_center_id
          });
        });

        totalPages = Number(data.totalPages) || 1;
        page += 1;
      } while (page <= totalPages && page <= 50);

      set({ courts: allCourts });
    } catch (err) {
      // No limpiar courts: se conserva la instantánea previa del localStorage
      console.error("Error fetching courts:", err);
    }
  },

  fetchSchedules: async (centerId: string, date?: string) => {
    const requestId = ++schedulesRequestId;
    set({ isLoading: true });
    try {
      const baseUrl = `/sport-centers/${centerId}/schedules`;
      const params = new URLSearchParams();
      params.append('all', 'true');
      if (date) params.append('date', date);
      
      const { data } = await api.get(`${baseUrl}?${params.toString()}`);

      // Otra petición más nueva se lanzó mientras ésta esperaba: descartarla
      if (requestId !== schedulesRequestId) return;
      
      // Asegurarse de que payment_required se asigne correctamente a paymentRequired
      const formattedData = (data || []).map((court: any) => ({
        ...court,
        schedule: (court.schedule || []).map((slot: any) => ({
          ...slot,
          paymentRequired: slot.payment_required,
          paymentOptional: slot.payment_optional,
          partialPaymentEnabled: slot.partial_payment_enabled !== undefined ? slot.partial_payment_enabled : (get().sportCenterBySlug?.partialPaymentEnabled ?? false),
          customer_name: slot.customer_name,
          customer_email: slot.customer_email,
          booking_code: slot.booking_code,
          isPartialPayment: slot.is_partial_payment,
          paidAmount: slot.paid_amount,
          pendingAmount: slot.pending_amount,
          partialPaymentPaid: slot.partial_payment_paid
        }))
      }));

      set({ schedules: formattedData, error: null });
    } catch (err) {
      if (requestId !== schedulesRequestId) return;
      console.error("Error fetching schedules:", err);
      set({ error: 'Failed to fetch schedules' });
    } finally {
      if (requestId === schedulesRequestId) set({ isLoading: false });
    }
  },

  // Fetch schedules with booking customer details (admin-protected)
  fetchAdminSchedules: async (centerId: string, date: string | undefined, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email'
        },
      });

      const params = new URLSearchParams();
      params.append('all', 'true');
      if (date) params.append('date', date);

      const { data } = await api.get(`/admin/sport-centers/schedules/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const formattedData = (data || []).map((court: any) => ({
        ...court,
        schedule: (court.schedule || []).map((slot: any) => ({
          ...slot,
          paymentRequired: slot.payment_required,
          paymentOptional: slot.payment_optional,
          partialPaymentEnabled: slot.partial_payment_enabled !== undefined ? slot.partial_payment_enabled : (get().sportCenterBySlug?.partialPaymentEnabled ?? false),
          customer_name: slot.customer_name,
          customer_email: slot.customer_email,
          customer_phone: slot.customer_phone,
          booking_code: slot.booking_code,
          isPartialPayment: slot.is_partial_payment,
          paidAmount: slot.paid_amount,
          pendingAmount: slot.pending_amount,
          partialPaymentPaid: slot.partial_payment_paid
        }))
      }));

      const dateKey = date || new Date().toISOString().split('T')[0];
      set(state => ({
        schedules: formattedData,
        weeklySchedules: {
          ...(state.weeklySchedules || {}),
          [dateKey]: formattedData
        },
        error: null
      }));

      return formattedData;
    } catch (err) {
      console.error('Error fetching admin schedules:', err);
      set({ error: 'Failed to fetch admin schedules' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Trae los schedules de un rango de fechas en una sola llamada al backend.
  // Si falla, hace fallback por día usando el endpoint público.
  fetchAdminSchedulesRange: async (centerId: string, from: string, to: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: 'openid profile email'
        },
      });

      const params = new URLSearchParams({ all: 'true', centerId, from, to });

      const { data } = await api.get(`/admin/sport-centers/schedules/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const entries: Record<string, any[]> = {};
      (Array.isArray(data) ? data : []).forEach((entry: any) => {
        entries[entry.date] = (entry.courts || []).map((court: any) => ({
          ...court,
          schedule: (court.schedule || []).map((slot: any) => ({
            ...slot,
            paymentRequired: slot.payment_required,
            paymentOptional: slot.payment_optional,
            partialPaymentEnabled: slot.partial_payment_enabled !== undefined ? slot.partial_payment_enabled : (get().sportCenterBySlug?.partialPaymentEnabled ?? false),
            customer_name: slot.customer_name,
            customer_email: slot.customer_email,
            customer_phone: slot.customer_phone,
            booking_code: slot.booking_code,
            isPartialPayment: slot.is_partial_payment,
            paidAmount: slot.paid_amount,
            pendingAmount: slot.pending_amount,
            partialPaymentPaid: slot.partial_payment_paid
          }))
        }));
      });

      set(state => ({
        weeklySchedules: { ...(state.weeklySchedules || {}), ...entries },
        error: null
      }));

      return entries;
    } catch (err) {
      console.error('Error fetching admin schedules range:', err);
      try {
        const entries: Record<string, any[]> = {};
        const dates: string[] = [];
        let d = new Date(from + 'T00:00:00');
        const end = new Date(to + 'T00:00:00');
        while (d <= end) {
          dates.push(format(d, 'yyyy-MM-dd'));
          d = addDays(d, 1);
        }
        for (const dateStr of dates) {
          await get().fetchSchedules(centerId, dateStr);
          entries[dateStr] = get().schedules;
        }
        set(state => ({
          weeklySchedules: { ...(state.weeklySchedules || {}), ...entries },
          error: null
        }));
        return entries;
      } catch (fallbackErr) {
        console.error('Fallback error fetching schedules range:', fallbackErr);
        set({ error: 'Failed to fetch admin schedules range' });
        return null;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminCourts: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const { data } = await api.get('/admin/courts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ adminCourts: data, error: null });
    } catch (err) {
      console.error("Error fetching admin courts:", err);
      set({ error: 'Failed to fetch admin courts' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminFacilities: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const { data } = await api.get('/admin/facilities', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ adminFacilities: data.facilities || data.data || [], error: null });
    } catch (err) {
      console.error("Error fetching admin facilities:", err);
      set({ error: 'Failed to fetch admin facilities' });
    } finally {
      set({ isLoading: false });
    }
  },

  createAdminFacility: async (facilityData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const res = await api.post('/admin/facilities', facilityData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error creating admin facility:", err);
      set({ error: 'Failed to create facility' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminFacility: async (facilityId: string, facilityData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const res = await api.put(`/admin/facilities/${facilityId}`, facilityData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error updating admin facility:", err);
      set({ error: 'Failed to update facility' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAdminFacility: async (facilityId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.delete(`/admin/facilities/${facilityId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error deleting admin facility:", err);
      set({ error: 'Failed to delete facility' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminSpaces: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const { data } = await api.get('/admin/spaces', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ adminSpaces: data.spaces || data.data || [], error: null });
    } catch (err) {
      console.error("Error fetching admin spaces:", err);
      set({ error: 'Failed to fetch admin spaces' });
    } finally {
      set({ isLoading: false });
    }
  },

  createAdminSpace: async (spaceData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const res = await api.post('/admin/spaces', spaceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error creating admin space:", err);
      set({ error: 'Failed to create space' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminSpace: async (spaceId: string, spaceData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const res = await api.put(`/admin/spaces/${spaceId}`, spaceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error updating admin space:", err);
      set({ error: 'Failed to update space' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAdminSpace: async (spaceId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.delete(`/admin/spaces/${spaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error deleting admin space:", err);
      set({ error: 'Failed to delete space' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminDashboard: async (getToken: (options?: any) => Promise<string>, page: number = 1, limit: number = 10, date: string = '', name: string = '', code: string = '', status: string = '') => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        date,
        name,
        code,
        status
      });

      const { data } = await api.get(`/admin/dashboard?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Map snake_case from backend to camelCase for frontend
      const formattedData = {
        todayBookingsCount: data.today_bookings_count,
        todayRevenue: data.today_revenue,
        todayOnlineRevenue: data.today_online_revenue,
        todayVenueRevenue: data.today_venue_revenue,
        totalRevenue: data.total_revenue,
        totalOnlineRevenue: data.total_online_revenue,
        totalVenueRevenue: data.total_venue_revenue,
        cancelledCount: data.cancelled_count,
        recentBookings: (data.recent_bookings || []).map((b: any) => ({
          ...b,
          sportCenterName: b.sport_center_name,
          courtName: b.court_name,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          customerEmail: b.customer_email,
          userName: b.user_name, // Keeping for backward compatibility if needed
          isGuest: b.is_guest,
          paymentMethod: b.payment_method,
          cancelledBy: b.cancelled_by, paidAmount: b.paid_amount,
          pendingAmount: b.pending_amount,
          isPartialPayment: b.is_partial_payment,
          partialPaymentPaid: b.partial_payment_paid,
          createdAt: b.created_at
        })),
        totalRecentCount: data.total_recent_count,
        page: data.page,
        limit: data.limit,
        totalPages: data.total_pages
      };

      set({ adminDashboardData: formattedData, error: null });
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
      set({ error: 'Failed to fetch dashboard data' });
    } finally {
      set({ isLoading: false });
    }
  },

  createAdminCourt: async (courtData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const res = await api.post('/admin/courts', courtData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error creating admin court:", err);
      set({ error: 'Failed to create court' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminCourt: async (courtId: string, courtData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const res = await api.put(`/admin/courts/${courtId}`, courtData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return res.data;
    } catch (err) {
      console.error("Error updating admin court:", err);
      set({ error: 'Failed to update court' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAdminCourt: async (courtId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      await api.delete(`/admin/courts/${courtId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error deleting admin court:", err);
      set({ error: 'Failed to delete court' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminSchedule: async (courtId: string, schedule: any[], getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      const formattedSchedule = schedule.map(s => ({
        hour: Number(s.hour),
        minutes: Number(s.minutes || 0),
        price: Number(s.price),
        status: s.enabled ? 'available' : 'closed',
        payment_required: !!s.paymentRequired,
        payment_optional: !!s.paymentOptional,
        partial_payment_enabled: s.partialPaymentEnabled ?? false,
        day_of_week: s.dayOfWeek !== undefined && s.dayOfWeek !== null ? Number(s.dayOfWeek) : null
      }));

      await api.put(`/admin/courts/${courtId}/schedule`, formattedSchedule, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update local state to reflect the change immediately without additional fetch
      const currentAdminCourts = get().adminCourts;
      const updatedAdminCourts = currentAdminCourts.map((ac: any) => {
        if (ac.courts && ac.courts.some((c: any) => (c.id || c._id) === courtId)) {
          return {
            ...ac,
            courts: ac.courts.map((c: any) => {
              if ((c.id || c._id) === courtId) {
                return { ...c, schedule: formattedSchedule };
              }
              return c;
            })
          };
        }
        return ac;
      });

      set({ adminCourts: updatedAdminCourts, error: null });
    } catch (err) {
      console.error("Error updating schedule:", err);
      set({ error: 'Failed to update schedule' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminScheduleSlot: async (courtId: string, slot: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });

      const formattedSlot = {
        hour: Number(slot.hour),
        minutes: Number(slot.minutes || 0),
        price: Number(slot.price),
        status: slot.enabled ? 'available' : 'closed',
        payment_required: !!slot.paymentRequired,
        payment_optional: !!slot.paymentOptional, partial_payment_enabled: slot.partialPaymentEnabled
      };

      await api.patch(`/admin/courts/${courtId}/schedule/slot`, formattedSlot, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state to reflect the change immediately
      const currentAdminCourts = get().adminCourts;
      const updatedAdminCourts = currentAdminCourts.map((ac: any) => {
        // Find the sport center containing the court
        if (ac.courts && ac.courts.some((c: any) => (c.id || c._id) === courtId)) {
          return {
            ...ac,
            courts: ac.courts.map((c: any) => {
              if ((c.id || c._id) === courtId) {
                // Update the specific slot in the schedule
                const updatedSchedule = (c.schedule || []).map((s: any) => {
                  if (s.hour === formattedSlot.hour && (s.minutes || 0) === formattedSlot.minutes) {
                    return formattedSlot;
                  }
                  return s;
                });
                return { ...c, schedule: updatedSchedule };
              }
              return c;
            })
          };
        }
        return ac;
      });
      
      set({ adminCourts: updatedAdminCourts, error: null });
    } catch (err) {
      console.error("Error updating schedule slot:", err);
      set({ error: 'Failed to update schedule slot' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createInternalBooking: async (bookingData: any, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.post('/admin/bookings/internal', bookingData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error creating internal booking:", err);
      set({ error: 'Failed to create internal booking' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBooking: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.delete(`/admin/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error deleting booking:", err);
      set({ error: 'Failed to delete booking' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  rescheduleBooking: async (bookingId, data, getToken) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      const { data: booking } = await api.patch(`/admin/bookings/${bookingId}/reschedule`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
      return booking;
    } catch (err) {
      console.error("Error rescheduling booking:", err);
      set({ error: 'Failed to reschedule booking' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  payBalance: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.post(`/admin/bookings/${bookingId}/pay-balance`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error paying balance:", err);
      set({ error: 'Failed to pay balance' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  undoPayBalance: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      });
      await api.patch(`/admin/bookings/${bookingId}/undo-pay-balance`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      set({ error: null });
    } catch (err) {
      console.error("Error undoing balance payment:", err);
      set({ error: 'Failed to undo balance payment' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  initialize: async () => {
    const currentApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const storedApiUrl = get().apiUrl;

    if (storedApiUrl && currentApiUrl && storedApiUrl !== currentApiUrl) {
      // Environment changed, reset store
      useBookingStore.persist.clearStorage();
      // Force reload the page to ensure a clean state if needed, 
      // or just clear the state using set()
      set({
        sportCenters: [],
        courts: [],
        selectedCenterId: null,
        apiUrl: currentApiUrl,
        schedules: [],
        weeklySchedules: {},
      });
    } else {
      set({ apiUrl: currentApiUrl });
    }

    const promises: Promise<void>[] = [];
    
    // Revalidar SIEMPRE: el cache de localStorage puede quedar obsoleto
    // (centros/canchas que ya no existen o una lista truncada a 10 canchas)
    promises.push(get().fetchSportCenters());
    promises.push(get().fetchCourts());
    
    await Promise.all(promises);
  },

  createRecurringReservation: async (data: CreateRecurringReservationDTO, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      await createRecurringApi(data, await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      }));
      set({ error: null });
      toast.success('Reserva semanal creada con éxito');
    } catch (err: any) {
      console.error("Error creating recurring reservation:", err);
      set({ error: 'Failed to create recurring reservation' });
      const serverMessage = err?.response?.data?.error;
      toast.error(serverMessage || 'Error al crear reserva semanal');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelRecurringReservation: async (id: string, getToken: (options?: any) => Promise<string>, reason = '') => {
    set({ isLoading: true });
    try {
      await cancelRecurringApi(id, await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      }), 'admin', reason);
      set({ error: null });
      toast.success('Reserva indefinida finalizada');
    } catch (err) {
      console.error("Error cancelling recurring reservation:", err);
      set({ error: 'Failed to cancel recurring reservation' });
      toast.error('Error al cancelar reserva semanal');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelRecurringDate: async (id: string, date: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      await cancelRecurringDateApi(id, date, await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        },
      }));
      set({ error: null });
      toast.success('Fecha cancelada de la reserva semanal');
    } catch (err) {
      console.error("Error cancelling recurring date:", err);
      set({ error: 'Failed to cancel recurring date' });
      toast.error('Error al cancelar la fecha');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRecurringReservationsByCenter: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const result = await getRecurringReservationsByCenter(await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      }));
      set({ recurringReservations: result.data || [], error: null });
    } catch (err) {
      console.error("Error fetching recurring reservations:", err);
      set({ error: 'Failed to fetch recurring reservations' });
    } finally {
      set({ isLoading: false });
    }
  }
  }),
  {
    name: 'booking-store',
    version: 3,
    // selectedCenterId ya no se persiste: la ruta (slug) es la fuente de verdad.
    // Rehidratar un centro viejo hacía que el primer fetch saliera con el centro equivocado.
    partialize: (state: BookingState) => ({
      apiUrl: state.apiUrl,
    }),
    migrate: (persistedState: any) => ({
      ...persistedState,
      selectedCenterId: null,
    }),
  }
  )
);
