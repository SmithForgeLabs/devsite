"use client";

import { useState } from "react";
import { Pencil, Send } from "lucide-react";

export default function QuickDraft() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function handleSave() {
    if (!title.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: title
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
          content: content.trim() || "",
          status: "DRAFT",
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Pencil size={14} className="text-gray-500" />
        <h3 className="font-semibold text-sm text-gray-700">Bozza rapida</h3>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Scrivi qualcosa..."
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={!title.trim() || status === "saving"}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={13} />
            {status === "saving" ? "Salvataggio..." : "Salva bozza"}
          </button>
          {status === "done" && (
            <span className="text-xs text-green-600">Bozza salvata!</span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-500">Errore nel salvataggio</span>
          )}
        </div>
      </div>
    </div>
  );
}
