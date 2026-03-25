"use client";

interface ExcerptBoxProps {
  excerpt: string;
  onChange: (value: string) => void;
}

export default function ExcerptBox({ excerpt, onChange }: ExcerptBoxProps) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
        Estratto
      </div>
      <div className="p-3">
        <textarea
          value={excerpt}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Scrivi un breve riassunto dell'articolo..."
          rows={4}
          maxLength={1000}
          className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
        />
        <p className="text-xs text-gray-400 mt-1">
          L&apos;estratto è un breve riassunto. Se lasci vuoto, verrà generato automaticamente.
        </p>
      </div>
    </div>
  );
}
