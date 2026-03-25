"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Upload, Search, Grid, List, Check } from "lucide-react";

export interface MediaItem {
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

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { storageKey: string; url: string }) => void;
  accept?: "IMAGE" | "VIDEO" | "FILE";
  multi?: boolean;
}

const TABS = ["Libreria media", "Carica file"] as const;
type Tab = (typeof TABS)[number];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = "IMAGE",
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<Tab>("Libreria media");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (accept === "IMAGE") params.set("type", "image");
      else if (accept === "VIDEO") params.set("type", "video");
      const res = await fetch(`/api/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.media ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, accept]);

  useEffect(() => {
    if (open && tab === "Libreria media") {
      fetchMedia();
    }
  }, [open, tab, fetchMedia]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setUploadError(null);
      setUploadProgress(0);
      setTab("Libreria media");
    }
  }, [open]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore upload" }));
        setUploadError(err.error ?? "Errore upload");
        return;
      }

      const data = await res.json();
      // Switch to library and select the new item
      setTab("Libreria media");
      await fetchMedia();
      setSelected(data.media);
    } catch {
      setUploadError("Errore di rete");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  }

  function handleInsert() {
    if (!selected) return;
    onSelect({ storageKey: selected.storageKey, url: selected.url });
  }

  if (!open) return null;

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.filename.toLowerCase().includes(q) ||
      (item.alt ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Inserisci elemento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-[#2271b1] text-[#2271b1]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {tab === "Libreria media" ? (
            <>
              {/* Main grid area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <div className="relative flex-1 max-w-xs">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cerca elementi"
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                    />
                  </div>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-1.5 rounded ${view === "grid" ? "bg-[#2271b1] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-1.5 rounded ${view === "list" ? "bg-[#2271b1] text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      Caricamento...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      Nessun elemento trovato
                    </div>
                  ) : view === "grid" ? (
                    <div className="grid grid-cols-5 gap-2">
                      {filtered.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelected(item)}
                          className={`relative rounded border-2 overflow-hidden aspect-square transition-colors ${
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
                            <div className="absolute top-1 right-1 bg-[#2271b1] text-white rounded-full p-0.5">
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filtered.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelected(item)}
                          className={`w-full flex items-center gap-3 py-2 px-1 hover:bg-gray-50 rounded transition-colors ${
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
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm text-gray-800 truncate">{item.filename}</p>
                            <p className="text-xs text-gray-400">{formatBytes(item.size)}</p>
                          </div>
                          {selected?.id === item.id && (
                            <Check size={16} className="text-[#2271b1] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar — attachment details */}
              {selected && (
                <div className="w-64 flex-shrink-0 border-l border-gray-200 overflow-y-auto p-3 space-y-3">
                  {isImage(selected.mimeType) && (
                    <img
                      src={selected.url}
                      alt={selected.alt ?? selected.filename}
                      className="w-full rounded border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">Nome file</p>
                    <p className="text-xs text-gray-500 break-all">{selected.filename}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">Tipo</p>
                    <p className="text-xs text-gray-500">{selected.mimeType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">Dimensioni</p>
                    <p className="text-xs text-gray-500">{formatBytes(selected.size)}</p>
                  </div>
                  {selected.caption && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">Didascalia</p>
                      <p className="text-xs text-gray-500">{selected.caption}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Upload tab */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div
                ref={dropRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-[#2271b1] hover:text-[#2271b1] transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={36} />
                <p className="text-sm text-center">
                  Trascina qui i file da caricare
                  <br />
                  <span className="text-xs">oppure clicca per selezionare</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    accept === "IMAGE"
                      ? "image/*"
                      : accept === "VIDEO"
                      ? "video/*"
                      : undefined
                  }
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>

              {uploading && (
                <div className="mt-4 w-full max-w-md">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2271b1] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">Caricamento in corso...</p>
                </div>
              )}

              {uploadError && (
                <p className="mt-3 text-sm text-red-600">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleInsert}
            disabled={!selected}
            className="px-4 py-1.5 text-sm bg-[#2271b1] text-white rounded hover:bg-[#1761a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Inserisci
          </button>
        </div>
      </div>
    </div>
  );
}
