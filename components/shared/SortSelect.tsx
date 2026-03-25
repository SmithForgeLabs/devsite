"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value) {
      next.set("sort", e.target.value);
    } else {
      next.delete("sort");
    }
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-[#E5E5E3] bg-white px-3 py-2 text-sm text-[#1A1A1A] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
      aria-label="Ordina per"
    >
      <option value="">Più recenti</option>
      <option value="price_asc">Prezzo crescente</option>
      <option value="price_desc">Prezzo decrescente</option>
    </select>
  );
}
