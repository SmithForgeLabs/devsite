"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Check } from "lucide-react";

interface Props {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  inStock: boolean;
}

export default function AddToCartButton({ productId, slug, name, price, image, inStock }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-zinc-500 cursor-not-allowed"
      >
        Prodotto esaurito
      </button>
    );
  }

  function handleAdd() {
    addItem({ productId, slug, name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={added}
      className={`group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${
        added
          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
          : "bg-white text-[#09090B] hover:bg-zinc-100"
      }`}
    >
      {/* Ripple effect on add */}
      {added && (
        <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-500/10" />
      )}
      <span className="relative flex items-center gap-2.5 transition-all duration-200">
        {added ? (
          <>
            <Check size={17} strokeWidth={2.5} className="animate-[scale-in_0.2s_ease-out]" />
            Aggiunto al carrello!
          </>
        ) : (
          <>
            <ShoppingCart size={17} strokeWidth={1.8} className="transition-transform group-hover:-translate-y-0.5" />
            Aggiungi al carrello
          </>
        )}
      </span>
    </button>
  );
}