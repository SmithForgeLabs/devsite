"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "ADMIN" | "EDITOR" | "READER";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;

  setUser: (user: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  isAdmin: () => boolean;
  isEditorOrAbove: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { ok: false, error: data.error ?? "Errore di accesso" };
          }
          set({ user: data.user, isLoading: false });
          return { ok: true };
        } catch {
          set({ isLoading: false });
          return { ok: false, error: "Errore di rete" };
        }
      },

      register: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) {
            set({ isLoading: false });
            return { ok: false, error: data.error ?? "Errore di registrazione" };
          }
          set({ user: data.user, isLoading: false });
          return { ok: true };
        } catch {
          set({ isLoading: false });
          return { ok: false, error: "Errore di rete" };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } finally {
          set({ user: null, isLoading: false });
        }
      },

      refreshUser: async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user });
          } else {
            // Try silent token refresh
            const refreshRes = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              set({ user: data.user });
            } else {
              set({ user: null });
            }
          }
        } catch {
          set({ user: null });
        }
      },

      isAdmin: () => get().user?.role === "ADMIN",
      isEditorOrAbove: () =>
        get().user?.role === "ADMIN" || get().user?.role === "EDITOR",
    }),
    {
      name: "devsite-auth",
      storage: createJSONStorage(() => sessionStorage), // sessionStorage: cleared on tab close
      partialize: (state) => ({ user: state.user }), // only persist user, not loading state
    }
  )
);
