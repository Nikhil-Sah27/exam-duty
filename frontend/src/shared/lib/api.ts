import axios from "axios";
import { useAuthStore } from "@/shared/store/auth.store";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach token from store. Prefer the full-role token;
// fall back to the tempToken (only valid for /auth/select-role) when the user
// hasn't chosen a role yet.
api.interceptors.request.use(
  (config) => {
    const { token, tempToken } = useAuthStore.getState();
    const auth = token || tempToken;
    if (auth) {
      config.headers.Authorization = `Bearer ${auth}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors, handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export default api;
