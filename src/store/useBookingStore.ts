import { create } from 'zustand';
import { SportCenter, Court, CourtWithSchedule } from '../types';
import api from '../api/axiosInstance';
import { SPORT_CENTERS as MOCK_SPORT_CENTERS, COURTS as MOCK_COURTS } from '../data/mockData';

interface BookingState {
  sportCenters: SportCenter[];
  courts: Court[];
  schedules: CourtWithSchedule[];
  myBookings: any[];
  currentBooking: any | null;
  selectedCenterId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSportCenters: () => Promise<void>;
  fetchCourts: () => Promise<void>;
  fetchSchedules: (centerId: string, date?: string) => Promise<void>;
  fetchMyBookings: (getToken: (options?: any) => Promise<string>, isOld?: boolean) => Promise<void>;
  fetchConfirmedCount: (getToken: (options?: any) => Promise<string>) => Promise<number>;
  fetchBookingByCode: (code: string) => Promise<any>;
  createFintocPayment: (bookingData: any) => Promise<string>;
  cancelBooking: (bookingId: string, getToken: (options?: any) => Promise<string>) => Promise<void>;
  setSelectedCenterId: (id: string | null) => void;
  initialize: () => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  sportCenters: [],
  courts: [],
  schedules: [],
  myBookings: [],
  currentBooking: null,
  selectedCenterId: null,
  isLoading: false,
  error: null,

  setSelectedCenterId: (id: string | null) => {
    set({ selectedCenterId: id });
    if (id) {
      get().fetchSchedules(id);
    }
  },

  fetchMyBookings: async (getToken: (options?: any) => Promise<string>, isOld: boolean = false) => {
    set({ isLoading: true });
    try {
      console.log("Attempting to fetch my bookings with token...", import.meta.env.VITE_APP_AUTH0_AUDIENCE);
      const token = await getToken({
        authorizationParams: {
          audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
          scope: "openid profile email"
        }
      });
      console.log("Token obtained for fetching bookings:", token); 
      const { data } = await api.get(`/bookings/my-bookings${isOld ? '?old=true' : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // La API ahora retorna un objeto PagedResponse con { data, total, page, limit, total_pages }
      set({ myBookings: data.data || [], error: null });
    } catch (err) {
      console.error("Error fetching my bookings:", err);
      set({ error: 'Failed to fetch your bookings' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConfirmedCount: async (getToken: (options?: any) => Promise<string>) => {
    try {
      const token = await getToken({
        authorizationParams: {
          audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
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

  fetchBookingByCode: async (code: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/bookings/code/${code}`);
      set({ currentBooking: data, error: null });
      return data;
    } catch (err) {
      console.error("Error fetching booking by code:", err);
      set({ error: 'Failed to fetch booking' });
      return null;
    } finally {
      set({ isLoading: false });
    }
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

  cancelBooking: async (bookingId: string, getToken: (options?: any) => Promise<string>) => {
    set({ isLoading: true });
    try {
      const token = await getToken({
        authorizationParams: {
          audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
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

  fetchSportCenters: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/sport-centers');
      const centersData = data.data || data;
      const centers: SportCenter[] = centersData.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
        location: c.address,
        address: c.address,
        phone: c.contact?.phone || '',
        email: c.contact?.email || '',
        image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000"
      }));
      
      set({ sportCenters: centers, error: null });
      
      if (centers.length > 0 && !get().selectedCenterId) {
          get().setSelectedCenterId(centers[0].id);
      }
    } catch (err) {
      console.error("Error fetching sport centers:", err);
      set({ error: 'Failed to fetch sport centers' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCourts: async () => {
    try {
      const { data } = await api.get('/courts');
      const courtsData = data.data || data;
      const allCourts: Court[] = courtsData.map((c: any) => ({
        id: c.id || c._id,
        name: c.name,
        shortName: c.name.split(' ')[0],
        type: c.description || 'Pasto Sintético',
        image: "https://images.unsplash.com/photo-1647118868186-70d38e10b0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080",
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
      set({ schedules: data, error: null });
    } catch (err) {
      console.error("Error fetching schedules:", err);
      set({ error: 'Failed to fetch schedules' });
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
}));
