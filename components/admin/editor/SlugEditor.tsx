"use client";

import { useState, useEffect } from "react";

interface SlugEditorProps {
  slug: string;
  baseUrl?: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export { titleToSlug };

export default function SlugEditor({ slug, baseUrl = "", onChange, disabled }: SlugEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slug);

  useEffect(() => { setDraft(slug); }, [slug]);

  const handleSave = () => {
    const cleaned = titleToSlug(draft) || slug;
    onChange(cleaned);
    setDraft(cleaned);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(slug);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
      <span className="text-gray-400">Permalink:</span>
      {editing ? (
        <>
          <span className="text-gray-600">{baseUrl}/</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            autoFocus
            className="border border-[#2271b1] rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1] min-w-[180px]"
          />
          <button
            onClick={handleSave}
            className="text-xs bg-[#2271b1] text-white px-2 py-0.5 rounded hover:bg-[#135e96] transition-colors"
          >
            OK
          </button>
          <button
            onClick={handleCancel}
            className="text-xs text-gray-500 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
          >
            Annulla
          </button>
        </>
      ) : (
        <>
          <span className="text-gray-700">
            {baseUrl}/<strong>{slug || "slug"}</strong>
          </span>
          {!disabled && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[#2271b1] hover:underline"
            >
              Modifica
            </button>
          )}
        </>
      )}
    </div>
  );
}
