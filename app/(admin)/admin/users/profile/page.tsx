"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load avatar from API (not stored in auth store)
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/users/${user.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user?.avatar) setAvatar(d.user.avatar); })
      .catch(() => {});
  }, [user?.id]);

  if (!user) {
    return (
      <div className="text-sm text-gray-500 p-4">
        Utente non autenticato.
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/users/${user!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, avatar: avatar.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Errore" }));
        throw new Error(d.error ?? "Errore durante il salvataggio");
      }
      const updated = await res.json();
      const newName = updated.user?.name !== undefined ? updated.user.name : (name.trim() || null);
      setUser({ ...user!, name: newName });
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
        <h1 className="text-xl font-semibold text-gray-800">Il mio profilo</h1>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Dashboard
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
            placeholder="Il tuo nome"
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
            <img src={avatar} alt="anteprima avatar" className="mt-2 h-12 w-12 rounded-full object-cover border" />
          )}
        </div>

        {/* Role — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
          <input
            type="text"
            value={user.role}
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Profilo aggiornato.</p>}

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
