"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Package } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  id: string;
  slug: string;
  pageSlug?: string;
  name: string;
  price: number;
  images?: string[];
  stock?: number;
  category?: string | null;
}

export default function ProductCard({ id, slug, pageSlug = "shop", name, price, images, stock = 0, category }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const firstImage = images?.[0] ?? null;
  const inStock = stock > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!inStock) return;
    addItem({ productId: id, slug, name, price, image: firstImage ?? undefined });
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <Link href={`/${pageSlug}/${slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white/[0.03]">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-700">
              <Package size={48} strokeWidth={1} />
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <span className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white">
                Non disponibile
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 gap-1">
        {category && (
          <span className="text-xs text-zinc-500 uppercase tracking-wider">{category}</span>
        )}
        <h3 className="font-heading text-sm font-semibold text-white leading-snug line-clamp-2">
          <Link href={`/${pageSlug}/${slug}`} className="transition-colors hover:text-zinc-300">
            {name}
          </Link>
        </h3>
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="font-heading font-bold text-white">
            {price.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              inStock
                ? "bg-white text-[#09090B] hover:bg-zinc-200"
                : "bg-white/[0.05] text-zinc-600 cursor-not-allowed"
            }`}
            aria-label={`Aggiungi ${name} al carrello`}
          >
            <ShoppingCart size={14} strokeWidth={1.8} />
            Aggiungi
          </button>
        </div>
      </div>
    </article>
  );
}
