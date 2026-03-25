"use client";

import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Package } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clear, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-zinc-700" strokeWidth={1} />
        <h1 className="mb-2 font-heading text-2xl font-bold text-white">Il tuo carrello è vuoto</h1>
        <p className="mb-8 text-zinc-500">Sfoglia il nostro negozio e aggiungi qualcosa di bello.</p>
        <Link
          href="/shop"
          className="inline-block rounded-xl border border-white/10 bg-white/[0.06] px-6 py-3 font-semibold text-white transition-all hover:bg-white/[0.1]"
        >
          Vai al negozio
        </Link>
      </div>
    );
  }

  const total = totalPrice();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 font-heading text-2xl font-extrabold text-white">Carrello</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-alt border border-border">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-700">
                    <Package size={24} strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Name + unit price + qty controls */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <Link href={`/shop/${item.slug}`} className="font-heading font-semibold text-white hover:text-zinc-300 line-clamp-1 transition-colors">
                  {item.name}
                </Link>
                <p className="text-sm text-zinc-500">
                  {item.price.toLocaleString("it-IT", { style: "currency", currency: "EUR" })} cad.
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-alt">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                      aria-label="Diminuisci quantità"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-medium text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                      aria-label="Aumenta quantità"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price + delete — fixed right column, never shifts */}
              <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                <span className="font-heading font-bold text-white whitespace-nowrap">
                  {(item.price * item.quantity).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-zinc-700 hover:text-red-400 transition-colors cursor-pointer"
                  aria-label="Rimuovi dal carrello"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={clear}
            className="text-sm text-zinc-600 hover:text-red-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Svuota carrello
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-surface p-6 h-fit">
          <h2 className="mb-4 font-heading text-lg font-bold text-white">Riepilogo ordine</h2>

          <div className="space-y-2 text-sm text-zinc-400">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="line-clamp-1 pr-2">{item.name} × {item.quantity}</span>
                <span className="shrink-0 text-zinc-300">
                  {(item.price * item.quantity).toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-border" />

          <div className="flex justify-between text-base font-bold text-white">
            <span>Totale</span>
            <span>{total.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">IVA inclusa, spedizione calcolata al checkout</p>

          <Link
            href="/checkout"
            className="mt-5 block w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#09090B] transition-all hover:bg-zinc-100 active:scale-[0.98]"
          >
            Procedi al checkout
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Continua a fare acquisti
          </Link>
        </div>
      </div>
    </div>
  );
}