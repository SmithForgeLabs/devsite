"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Credenziali non valide.");
      return;
    }
    const user = useAuthStore.getState().user;
    if (user?.role === "ADMIN" || user?.role === "EDITOR") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  }

  const inputClass =
    "block w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Torna al sito
          </Link>
        </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-6 text-center">
          <Link href="/" className="font-heading text-2xl font-extrabold text-white">
            DevSite
          </Link>
          <h1 className="mt-2 font-heading text-xl font-bold text-white">Accedi al tuo account</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Non hai un account?{" "}
            <Link href="/register" className="text-indigo-400 font-medium hover:text-indigo-300">
              Registrati
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@esempio.it"
              className={inputClass}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
