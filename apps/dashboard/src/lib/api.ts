import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/refresh')) {
      try {
        await api.post('/v1/auth/refresh');
        return api.request(err.config);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
