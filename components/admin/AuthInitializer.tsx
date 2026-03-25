"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Silently restores auth state on mount when the Zustand store is empty
 * (e.g., new tab opened, sessionStorage cleared).
 * Runs once; no visible UI.
 */
export default function AuthInitializer() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
