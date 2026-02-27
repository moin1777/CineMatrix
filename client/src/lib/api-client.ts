import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Types for API responses
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// In-memory access token storage (secure - not in localStorage)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

// Queue for failed requests during token refresh
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // CRITICAL: Always include cookies
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Attach access token to Authorization header if available
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor with refresh token logic
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Don't retry refresh endpoint itself - just reject
        if (originalRequest.url?.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => client(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh the token
          const response = await client.post<{ accessToken: string }>('/auth/refresh');
          
          // Store the new access token
          const newAccessToken = response.data.accessToken;
          setAccessToken(newAccessToken);
          
          // Token refresh successful, process queued requests
          processQueue(null);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear token and process queue with error
          clearAccessToken();
          processQueue(refreshError as Error);
          
          // Don't redirect here - let the calling code handle auth failures
          // Protected pages/components should check isAuthenticated and redirect as needed
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Format error for consistent handling
      const formattedError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        errors: error.response?.data?.errors,
        statusCode: error.response?.status || 500,
      };

      return Promise.reject(formattedError);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();

// Typed request helpers
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

export default apiClient;
