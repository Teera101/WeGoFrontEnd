import axios, {
  AxiosInstance,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

// Normalize VITE_API_URL: if provided without "/api" suffix, append it.
const _rawApiBase = (import.meta.env.VITE_API_URL as string) || '';
const _defaultBase = 'http://localhost:10000';
const _baseNoSlash = (_rawApiBase || _defaultBase).replace(/\/$/, '');
const _baseUrl = _baseNoSlash.endsWith('/api') ? _baseNoSlash : `${_baseNoSlash}/api`;

export const api: AxiosInstance = axios.create({
  baseURL: _baseUrl, // override with VITE_API_URL in production
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }

      if (config.headers instanceof AxiosHeaders) {
        config.headers.set("Authorization", `Bearer ${token}`);
        if (!config.headers.has("Content-Type")) {
          config.headers.set("Content-Type", "application/json");
        }
      } else {
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
        if (!(config.headers as any)["Content-Type"]) {
          (config.headers as any)["Content-Type"] = "application/json";
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(new Error(response.data.message || 'เกิดข้อผิดพลาด'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect automatically - let components handle it
      // Only redirect if token is invalid (not just missing permissions)
      // localStorage.removeItem('token');
      // window.location.href = '/auth/signin';
      return Promise.reject(error); // Return error object so component can check status
    }

    if (error.response?.status === 403) {
      return Promise.reject(error); // Let component handle forbidden
    }

    if (error.response?.status === 404) {
      return Promise.reject(new Error('ไม่พบข้อมูลที่ต้องการ'));
    }

    // Support backend returning either { message: '...' } or { error: '...' }
    const serverMsg = error.response?.data?.message || error.response?.data?.error;
    if (serverMsg) {
      return Promise.reject(new Error(serverMsg));
    }

    return Promise.reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'));
  }
);