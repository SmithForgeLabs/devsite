"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  _count?: { products: number };
}

export default function AdminProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?limit=200");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openNew() {
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormParentId("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parentId ?? "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);
    const body = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, "-"),
      parentId: formParentId || null,
    };
    try {
      const res = editingId
        ? await fetch(`/api/categories/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        setShowForm(false);
        fetchCategories();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function doDelete(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Impossibile eliminare la categoria");
    } else {
      fetchCategories();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Categorie prodotti</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] transition-colors"
        >
          <Plus size={14} /> Aggiungi
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-sm text-gray-700">
            {editingId ? "Modifica categoria" : "Nuova categoria"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="auto-generato dal nome"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoria padre</label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              >
                <option value="">— Nessuna —</option>
                {categories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="px-4 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            Caricamento...
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            Nessuna categoria
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Slug</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Padre</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-2 text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {cat.parentId
                      ? categories.find((c) => c.id === cat.parentId)?.name ?? "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-[#2271b1]">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questa categoria? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {deleteError && (
        <ConfirmDialog
          title="Eliminazione non riuscita"
          message={deleteError}
          confirmLabel="OK"
          cancelLabel=""
          onConfirm={() => setDeleteError(null)}
          onCancel={() => setDeleteError(null)}
        />
      )}
    </div>
  );
}
