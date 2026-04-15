import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SportCenter, Court, CourtWithSchedule, Booking, BookingDTO } from '../types';
import api from '../api/axiosInstance';
import { getUserCancelledBookings } from '../api/bookingApi';
import { mapBooking } from '../mapper/mapBooking';

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
  isLoading: boolean;
  error: string | null;
  adminCourts: any[];
  adminDashboardData: any | null;
  recurringSeries: any[];
  sportCenterBySlug: SportCenter | null;
  cities: string[];


  // Actions
  fetchSportCenters: (filters?: { page?: number; limit?: number; name?: string; city?: string; date?: string; hour?: number }) => Promise<void>;
  fetchCities: () => Promise<string[]>;
  fetchCourts: () => Promise<void>;
  fetchSchedules: (centerId: string, date?: string) => Promise<void>;
  fetchAdminSchedules: (centerId: string, date: string | undefined, getToken: (options?: any) => Promise<string>) => Promise<any[]>;
  fetchMyBookings: (getToken: (options?: any) => Promise<string>, isOld?: boolean) => Promise<void>;
  fetchCancelledBookings: (getToken: (options?: any) => Promise<string>, page?: number, limit?: number) => Promise<any[]>;
  fetchConfirmedCount: (getToken: (options?: any) => Promise<string>) => Promise<number>;
  fetchBookingDetail: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<any>;
  fetchBookingByCode: (code: string) => Promise<any>;
  resetCurrentBooking: () => void;
  createFintocPayment: (bookingData: any) => Promise<string>;
  createMercadoPagoPayment: (bookingData: any) => Promise<string>;
  cancelBooking: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  setSelectedCenterId: (id: string | null) => void;
  initialize: () => Promise<void>;
  fetchAdminCourts: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchAdminDashboard: (getToken: (options?: any) => Promise<string>, page?: number, limit?: number, date?: string, name?: string, code?: string, status?: string) => Promise<void>;
  fetchRecurringSeries: (getToken: (options?: any) => Promise<string>) => Promise<void>;
  createAdminCourt: (courtData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  updateAdminCourt: (courtId: string, courtData: any, getToken: (options?: any) => Promise<string>) => Promise<any>;
  deleteAdminCourt: (courtId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAdminSchedule: (courtId: string, schedule: any[], getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAdminScheduleSlot: (courtId: string, slot: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateAgentSportCenter?: (id: string, centerData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  createBooking: (bookingData: any) => Promise<void>;
  createInternalBooking: (bookingData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  deleteBooking: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  payBalance: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  undoPayBalance: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  deleteSeries: (seriesId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchSportCenterBySlug: (slug: string) => Promise<SportCenter | null>;
  updateSportCenter: (id: string, centerData: any, getToken: (options?: any) => Promise<string>) => Promise<void>;
  updateSportCenterSettings: (id: string, settingsData: { slug: string; cancellation_hours: number; retention_percent: number; partialPaymentEnabled?: boolean; partialPaymentPercent?: number }, getToken: (options?: any) => Promise<string>) => Promise<void>;
  fetchSportCenterByID: (id: string, getToken: (options?: any) => Promise<string>) => Promise<any>;
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
          paymentMethod: b.payment_method,
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
  courts: [],
  schedules: [],
  weeklySchedules: {},
  myBookings: [],
  cancelledBookings: [],
  isCancelledLoading: false,
  currentBooking: null,
  selectedCenterId: null,
  isLoading: false,
  error: null,
  adminCourts: [],
  adminDashboardData: null,
  recurringSeries: [],
  sportCenterBySlug: null,

  fetchRecurringSeries: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { data } = await api.get('/admin/bookings/series', {
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
      get().fetchSchedules(id);
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
        paymentMethod: b.payment_method || 'fintoc', // Fintoc as default if not coming from backend
        fintocPaymentIntentId: b.fintoc_payment_intent_id, paidAmount: b.paid_amount,
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
      // Return same shape as fetchBookingDetail (backend returns booking_detail + metadata)
      set({ currentBooking: data.booking_detail, error: null });
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

  createFintocPayment: async (bookingData: any) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/bookings/fintoc', bookingData);
      return data.redirect_url;
    } catch (err) {
      console.error("Error creating Fintoc payment:", err);
      set({ error: 'Failed to initiate payment' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  createMercadoPagoPayment: async (bookingData: any) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/bookings/mercadopago', bookingData);
      return data.init_point;
    } catch (err) {
      console.error("Error creating MercadoPago payment:", err);
      set({ error: 'Failed to initiate payment' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  createBooking: async (bookingData: any) => {
    set({ isLoading: true });
    try {
      await api.post('/bookings', bookingData);
      set({ error: null });
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
      await api.post(`/admin/bookings/${bookingId}/pay-balance`, {}, {
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

  deleteSeries: async (seriesId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
        }
      });
      await api.delete(`/admin/bookings/series/${seriesId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  fetchSportCenters: async (filters?: { page?: number; limit?: number; name?: string; city?: string; date?: string; hour?: number }) => {
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
      const centers: SportCenter[] = centersData.map((c: any) => {
        // Normalize coordinates: backend might send { lat, lng } or [lng, lat]
        let coordinates = { lat: -33.5922, lng: -71.6127 };
        if (c.coordinates) {
          if (Array.isArray(c.coordinates)) {
            coordinates = { lat: c.coordinates[1] || -33.5922, lng: c.coordinates[0] || -71.6127 };
          } else if (typeof c.coordinates === 'object') {
            coordinates = { lat: c.coordinates.lat ?? c.coordinates[1] ?? -33.5922, lng: c.coordinates.lng ?? c.coordinates[0] ?? -71.6127 };
          }
        }

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
          image: c.image || FALLBACK_IMAGE,
          cancellationHours: c.cancellation_hours,
          retentionPercent: c.retention_percent,
        partialPaymentEnabled: c.partial_payment_enabled,
        partialPaymentPercent: c.partial_payment_percent,
          services: c.services || [],
          coordinates
        } as SportCenter;
      });

      set({ sportCenters: centers, error: null });

      if (centers.length > 0 && !get().selectedCenterId) {
        get().setSelectedCenterId(centers[0].id);
      }
    } catch (err) {
      console.error('Error fetching sport centers:', err);
      set({ error: 'Failed to fetch sport centers' });
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
      const c = data;
      const center: SportCenter = {
        id: c.id || c._id,
        name: c.name,
        slug: c.slug,
        location: c.address,
        address: c.address,
        courts: c.courts ?? c.courts_count ?? (Array.isArray(c.courts) ? c.courts.length : undefined),
        contact: c.contact || { phone: '', email: '' }, 
        image: c.image || FALLBACK_IMAGE,
        cancellationHours: c.cancellation_hours,
        retentionPercent: c.retention_percent,
        partialPaymentEnabled: c.partial_payment_enabled,
        partialPaymentPercent: c.partial_payment_percent,
        services: c.services || [],
        coordinates: c.coordinates || { lat: 0, lng: 0 }
      };
      set({ sportCenterBySlug: center, selectedCenterId: center.id, error: null });
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

  updateSportCenterSettings: async (id: string, settingsData: { slug: string; cancellation_hours: number; retention_percent: number; partialPaymentEnabled?: boolean; partialPaymentPercent?: number }, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const { partialPaymentEnabled, partialPaymentPercent, ...rest } = settingsData;
      const apiPayload = {
        ...rest,
        partial_payment_enabled: partialPaymentEnabled,
        partial_payment_percent: partialPaymentPercent
      };
      await api.patch(`/admin/sport-centers/${id}/settings`, apiPayload, {
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

  fetchSportCenterByID: async (id: string, getToken: (options?: any) => Promise<string>) => {
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      const response = await api.get(`/admin/sport-centers/${id}`, {
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
          retentionPercent: center.retention_percent
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
      let data;
      try {
        const response = await api.get('/courts');
        data = response.data;
      } catch (err) {
        console.warn("API failed");
        data = { data: [] };
      }

      const courtsData = data.data || data;
      const allCourts: Court[] = courtsData.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
        shortName: c.name.split(' ')[0],
        type: c.description || 'Pasto Sintético',
        image: c.image || '/images/cancha1.jpeg',
        centerId: c.sport_center_id
      }));
      set({ courts: allCourts });
    } catch (err) {
      console.error("Error fetching courts:", err);
    }
  },

  fetchSchedules: async (centerId: string, date?: string) => {
    set({ isLoading: true });
    try {
      const baseUrl = `/sport-centers/${centerId}/schedules`;
      const params = new URLSearchParams();
      params.append('all', 'true');
      if (date) params.append('date', date);
      
      const { data } = await api.get(`${baseUrl}?${params.toString()}`);
      
      // Asegurarse de que payment_required se asigne correctamente a paymentRequired
      const formattedData = (data || []).map((court: any) => ({
        ...court,
        schedule: (court.schedule || []).map((slot: any) => ({
          ...slot,
          paymentRequired: slot.payment_required,
          paymentOptional: slot.payment_optional,
          partialPaymentEnabled: slot.partial_payment_enabled,
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
      console.error("Error fetching schedules:", err);
      set({ error: 'Failed to fetch schedules' });
    } finally {
      set({ isLoading: false });
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
        }
      });

      const params = new URLSearchParams();
      params.append('all', 'true');
      if (date) params.append('date', date);

      const { data } = await api.get(`/sport-centers/${centerId}/schedules/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const formattedData = (data || []).map((court: any) => ({
        ...court,
        schedule: (court.schedule || []).map((slot: any) => ({
          ...slot,
          paymentRequired: slot.payment_required,
          paymentOptional: slot.payment_optional,
          partialPaymentEnabled: slot.partial_payment_enabled,
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

  fetchAdminCourts: async (getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
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
        payment_optional: !!s.paymentOptional
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
        }
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
        }
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

  payBalance: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
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
        }
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
    await Promise.all([
      get().fetchSportCenters(),
      get().fetchCourts()
    ]);
  }
  }),
  {
    name: 'booking-store',
    partialize: (state: BookingState) => ({
      sportCenters: state.sportCenters,
      courts: state.courts,
      selectedCenterId: state.selectedCenterId,
    }),
  }
  )
);
