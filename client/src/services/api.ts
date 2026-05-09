import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // For cookies
});

// Request interceptor to add access token from memory if needed
// Actually, we'll keep the access token in memory in the auth store
// but for simplicity in this demo, let's assume it's handled by cookies
// or we can add a manual header.

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        accessToken = data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login or clear auth
        accessToken = null;
        const isAuthCheck = originalRequest.url?.includes('/auth/me');
        const isLoginSignup = window.location.pathname === '/login' || window.location.pathname === '/signup';
        
        if (!isAuthCheck && !isLoginSignup) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }


    }
    return Promise.reject(error);
  }
);

export default api;
