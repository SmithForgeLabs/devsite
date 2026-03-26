"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Grid, List, Trash2, Edit2, Check } from "lucide-react";
import MediaUploadZone from "./MediaUploadZone";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface MediaItem {
  id: string;
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  alt?: string | null;
  caption?: string | null;
  size: number;
  createdAt: string;
}

interface MediaLibraryProps {
  selectable?: boolean;
  onSelect?: (item: MediaItem) => void;
  initialTab?: "library" | "upload";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function MediaLibrary({ selectable, onSelect, initialTab = "library" }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">(initialTab);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const limit = 40;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.media ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (tab === "library") fetchMedia();
  }, [tab, fetchMedia]);

  function selectItem(item: MediaItem) {
    setSelected(item);
    setEditAlt(item.alt ?? "");
    setEditCaption(item.caption ?? "");
    if (selectable) onSelect?.(item);
  }

  async function saveAltCaption() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/media/${encodeURIComponent(selected.storageKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: editAlt, caption: editCaption }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === selected.id ? { ...i, alt: editAlt, caption: editCaption } : i))
      );
      setSelected((prev) => (prev ? { ...prev, alt: editAlt, caption: editCaption } : null));
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: MediaItem) {
    setPendingDelete(item);
  }

  async function doDelete(item: MediaItem) {
    await fetch(`/api/media/${encodeURIComponent(item.storageKey)}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (selected?.id === item.id) setSelected(null);
    setPendingDelete(null);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex h-full min-h-0">
      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            onClick={() => setTab("library")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "library"
                ? "border-b-2 border-[#2271b1] text-[#2271b1]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Libreria media
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "upload"
                ? "border-b-2 border-[#2271b1] text-[#2271b1]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Carica file
          </button>
        </div>

        {tab === "upload" ? (
          <div className="flex-1 p-4">
            <MediaUploadZone
              onUploaded={() => { setTab("library"); fetchMedia(); }}
            />
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
              <div className="relative max-w-xs flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Cerca elementi"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                />
              </div>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded ${view === "grid" ? "bg-[#2271b1] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  <Grid size={15} />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded ${view === "list" ? "bg-[#2271b1] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Grid/List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                  Caricamento...
                </div>
              ) : items.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                  Nessun file trovato
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-6 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`relative rounded border-2 overflow-hidden aspect-square cursor-pointer group transition-colors ${
                        selected?.id === item.id
                          ? "border-[#2271b1]"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      {isImage(item.mimeType) ? (
                        <img
                          src={item.url}
                          alt={item.alt ?? item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          {item.filename.split(".").pop()?.toUpperCase()}
                        </div>
                      )}
                      {selected?.id === item.id && (
                        <div className="absolute top-0.5 right-0.5 bg-[#2271b1] text-white rounded-full p-0.5">
                          <Check size={9} />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 opacity-0 group-hover:opacity-100 flex justify-end gap-1 p-0.5 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                          className="p-0.5 text-white hover:text-red-300"
                          title="Elimina"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => selectItem(item)}
                      className={`flex items-center gap-3 py-2 px-1 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                        selected?.id === item.id ? "bg-blue-50" : ""
                      }`}
                    >
                      {isImage(item.mimeType) ? (
                        <img
                          src={item.url}
                          alt={item.alt ?? item.filename}
                          className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                          {item.filename.split(".").pop()?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.filename}</p>
                        <p className="text-xs text-gray-400">
                          {item.mimeType} · {formatBytes(item.size)} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteItem(item); }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Elimina"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-2 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  ‹
                </button>
                <span className="text-xs text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail sidebar */}
      {selected && tab === "library" && (
        <div className="w-64 flex-shrink-0 border-l border-gray-200 overflow-y-auto p-3 space-y-3">
          {isImage(selected.mimeType) && (
            <img
              src={selected.url}
              alt={selected.alt ?? selected.filename}
              className="w-full rounded border border-gray-200"
            />
          )}
          <p className="text-xs font-semibold text-gray-700">{selected.filename}</p>
          <p className="text-xs text-gray-500">{formatBytes(selected.size)}</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Testo alternativo
            </label>
            <input
              type="text"
              value={editAlt}
              onChange={(e) => setEditAlt(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Didascalia</label>
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
            />
          </div>
          <button
            onClick={saveAltCaption}
            disabled={saving}
            className="w-full text-xs bg-[#2271b1] text-white rounded px-3 py-1.5 hover:bg-[#1761a8] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <Edit2 size={12} /> {saving ? "Salvataggio..." : "Aggiorna"}
          </button>
          <button
            onClick={() => deleteItem(selected)}
            className="w-full text-xs text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 size={12} /> Elimina definitivamente
          </button>
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          message={`Eliminare "${pendingDelete.filename}"? L'operazione è irreversibile.`}
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
