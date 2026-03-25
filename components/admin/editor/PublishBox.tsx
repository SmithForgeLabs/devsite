"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

interface PublishBoxProps {
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview?: () => void;
  loading?: boolean;
  isNew?: boolean;
}

export default function PublishBox({
  status,
  publishedAt,
  onSaveDraft,
  onPublish,
  onPreview,
  loading,
  isNew,
}: PublishBoxProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
        Pubblica
      </div>
      <div className="p-3 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Stato:</span>
          <span className={`font-medium ${status === "PUBLISHED" ? "text-green-600" : "text-yellow-600"}`}>
            {status === "PUBLISHED" ? "Pubblicato" : "Bozza"}
          </span>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Visibilità:</span>
          <span className="text-gray-800">Pubblico</span>
        </div>

        {/* Published date */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Data:</span>
          <button
            onClick={() => setShowDatePicker((p) => !p)}
            className="text-[#2271b1] hover:underline"
          >
            {publishedAt
              ? new Date(publishedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
              : "Immediatamente"}
          </button>
        </div>

        {showDatePicker && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            La programmazione degli articoli verrà implementata nella prossima fase.
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
          {/* Preview */}
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center justify-center gap-1.5 w-full text-sm text-[#2271b1] border border-[#2271b1] rounded px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <Eye size={14} />
              Anteprima
            </button>
          )}

          <div className="flex gap-2">
            {/* Save draft */}
            <button
              onClick={onSaveDraft}
              disabled={loading}
              className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Salva bozza
            </button>

            {/* Publish / Update */}
            <button
              onClick={onPublish}
              disabled={loading}
              className="flex-1 text-sm bg-[#2271b1] text-white rounded px-3 py-1.5 hover:bg-[#135e96] disabled:opacity-50 transition-colors font-medium"
            >
              {loading
                ? "Salvataggio..."
                : isNew
                ? status === "DRAFT" ? "Pubblica" : "Aggiorna"
                : "Aggiorna"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
