import { create } from "zustand";
import { User } from "@/shared/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  hydrate: () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    set({ token, isHydrated: true });
  },
}));
