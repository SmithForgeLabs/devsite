"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: string;
}

interface Props {
  user: User;
}

const ROLES = ["ADMIN", "EDITOR", "READER"] as const;

export default function UserEditForm({ user }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [name, setName] = useState(user.name ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const body: Record<string, unknown> = { name, avatar: avatar || null };
      if (isAdmin) body.role = role;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Errore durante il salvataggio");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Modifica utente
        </h1>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Torna all&apos;elenco
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-md border border-gray-200 p-6 space-y-5">
        {/* Email — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Avatar</label>
          <input
            type="url"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="avatar preview" className="mt-2 h-12 w-12 rounded-full object-cover border" />
          )}
        </div>

        {/* Role — ADMIN only */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Modifiche salvate.</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-[#2271b1] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#135e96] disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvataggio..." : "Salva modifiche"}
        </button>
      </form>
    </div>
  );
}
