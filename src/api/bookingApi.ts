import api from './axiosInstance';

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
