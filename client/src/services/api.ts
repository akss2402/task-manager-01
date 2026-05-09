import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        accessToken = data.accessToken;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);

      } catch (refreshError) {

        accessToken = null;

        const isAuthCheck = originalRequest.url?.includes('/auth/me');

        const isLoginSignup =
          window.location.pathname === '/login' ||
          window.location.pathname === '/signup';

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