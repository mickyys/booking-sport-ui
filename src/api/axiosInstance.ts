import axios from 'axios';
import { VIEW_CENTER_HEADER, getViewCenterId } from '@/lib/viewAs';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const id = getViewCenterId();
  if (id && String(config.url || '').startsWith('/admin/')) {
    config.headers.set(VIEW_CENTER_HEADER, id);
  }
  return config;
});

export default api;
