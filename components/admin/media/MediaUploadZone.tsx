"use client";

import { useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
  mediaId?: string;
  url?: string;
}

interface MediaUploadZoneProps {
  onUploaded?: (media: { id: string; storageKey: string; url: string; filename: string }) => void;
  accept?: "image/*" | "video/*" | "*/*";
  maxFiles?: number;
}

export default function MediaUploadZone({
  onUploaded,
  accept = "*/*",
  maxFiles = 10,
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const key = `${file.name}-${Date.now()}`;
    setFiles((prev) => [...prev, { name: file.name, status: "uploading" }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore upload" }));
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.status === "uploading"
              ? { ...f, status: "error", error: err.error ?? "Errore" }
              : f
          )
        );
        return;
      }

      const data = await res.json();
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name && f.status === "uploading"
            ? { ...f, status: "done", mediaId: data.media.id, url: data.media.url }
            : f
        )
      );
      onUploaded?.(data.media);
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name && f.status === "uploading"
            ? { ...f, status: "error", error: "Errore di rete" }
            : f
        )
      );
    }
    void key; // suppress unused warning
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList).slice(0, maxFiles);
    selected.forEach(uploadFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          isDragging
            ? "border-[#2271b1] bg-blue-50 text-[#2271b1]"
            : "border-gray-300 hover:border-[#2271b1] hover:bg-blue-50 text-gray-400 hover:text-[#2271b1]"
        }`}
      >
        <Upload size={32} />
        <div className="text-center">
          <p className="text-sm font-medium">Trascina qui i file da caricare</p>
          <p className="text-xs mt-0.5">oppure clicca per selezionare</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded border border-gray-200"
            >
              {f.status === "uploading" && (
                <div className="w-4 h-4 border-2 border-[#2271b1] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {f.status === "done" && (
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              )}
              {f.status === "error" && (
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              )}
              <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
              {f.status === "error" && (
                <span className="text-xs text-red-500">{f.error}</span>
              )}
              <button
                onClick={() => removeFile(f.name)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
