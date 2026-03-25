"use client";

interface SeoBoxProps {
  seoTitle: string;
  seoDescription: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

function charCountColor(val: string, max: number): string {
  const len = val.length;
  if (len === 0) return "text-gray-400";
  if (len <= max * 0.8) return "text-green-600";
  if (len <= max) return "text-yellow-600";
  return "text-red-600";
}

export default function SeoBox({
  seoTitle,
  seoDescription,
  onTitleChange,
  onDescriptionChange,
  fallbackTitle = "",
  fallbackDescription = "",
}: SeoBoxProps) {
  const displayTitle = seoTitle || fallbackTitle;
  const displayDesc = seoDescription || fallbackDescription;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
        SEO
      </div>
      <div className="p-3 space-y-3">
        {/* Google preview */}
        {(displayTitle || displayDesc) && (
          <div className="border border-gray-200 rounded p-3 bg-white">
            <p className="text-xs text-gray-400 mb-1">Anteprima Google</p>
            <p className="text-[#1a0dab] text-base leading-tight truncate">
              {displayTitle || "Titolo pagina"}
            </p>
            <p className="text-xs text-[#006621] truncate">https://example.com/...</p>
            <p className="text-sm text-[#545454] mt-0.5 line-clamp-2">
              {displayDesc || "Descrizione della pagina..."}
            </p>
          </div>
        )}

        {/* SEO Title */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">Titolo SEO</label>
            <span className={`text-xs ${charCountColor(seoTitle, SEO_TITLE_MAX)}`}>
              {seoTitle.length}/{SEO_TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={fallbackTitle || "Lascia vuoto per usare il titolo"}
            maxLength={SEO_TITLE_MAX + 20}
            className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>

        {/* SEO Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-700">Descrizione SEO</label>
            <span className={`text-xs ${charCountColor(seoDescription, SEO_DESC_MAX)}`}>
              {seoDescription.length}/{SEO_DESC_MAX}
            </span>
          </div>
          <textarea
            value={seoDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={fallbackDescription || "Lascia vuoto per usare l'estratto"}
            rows={3}
            maxLength={SEO_DESC_MAX + 40}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
        </div>
      </div>
    </div>
  );
}
