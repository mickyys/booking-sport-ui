import api from './axiosInstance';
import { SportCenter, CenterTimeSlot } from '../types';

export const getUserCancelledBookings = async (token: string, page = 1, limit = 5) => {
  const response = await api.get('/bookings/my-cancelled', {
    params: { page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
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
