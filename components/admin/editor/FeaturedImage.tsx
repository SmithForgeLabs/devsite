"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";

interface FeaturedImageProps {
  imageUrl?: string | null;
  storageKey?: string | null;
  onSelect: (storageKey: string, url: string) => void;
  onRemove: () => void;
}

export default function FeaturedImage({
  imageUrl,
  storageKey,
  onSelect,
  onRemove,
}: FeaturedImageProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
          Immagine in evidenza
        </div>
        <div className="p-3">
          {imageUrl ? (
            <div className="space-y-2">
              {/* Preview */}
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="Immagine in evidenza"
                  className="w-full h-36 object-cover rounded border border-gray-200"
                />
                <button
                  onClick={onRemove}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Rimuovi"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex-1 text-xs text-[#2271b1] border border-[#2271b1] rounded px-2 py-1 hover:bg-blue-50 transition-colors"
                >
                  Cambia
                </button>
                <button
                  onClick={onRemove}
                  className="flex-1 text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                >
                  Rimuovi
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded hover:border-[#2271b1] hover:bg-blue-50 transition-colors text-gray-400 hover:text-[#2271b1]"
            >
              <ImageIcon size={24} />
              <span className="text-xs">Imposta immagine in evidenza</span>
            </button>
          )}
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          onSelect(media.storageKey, media.url);
          setPickerOpen(false);
        }}
        accept="IMAGE"
      />
    </>
  );
}
