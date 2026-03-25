"use client";

import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  notes: string;
}

const EMPTY: FormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip: "",
  country: "IT",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clear } = useCartStore();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success && items.length === 0) {
      router.replace("/shop");
    }
  }, [items.length, success, router]);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          shipping: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            zip: form.zip,
            country: form.country,
          },
          notes: form.notes || undefined,
          total: totalPrice(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Errore durante il pagamento");
      }
      clear();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Si ГЁ verificato un errore. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="mb-4 text-6xl">рџЋ‰</div>
        <h1 className="mb-2 font-heading text-2xl font-extrabold text-white">Ordine confermato!</h1>
        <p className="mb-8 text-zinc-400">
          Grazie per il tuo acquisto. Riceverai una conferma via email a{" "}
          <strong className="text-white">{form.email}</strong>.
        </p>
        <Link
          href="/shop"
          className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-[#09090B] transition-all hover:bg-zinc-100 active:scale-[0.98]"
        >
          Continua a fare acquisti
        </Link>
      </div>
    );
  }

  const total = totalPrice();

  const inputClass =
    "block w-full rounded-xl border border-border bg-surface-alt px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-muted transition";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 font-heading text-2xl font-extrabold text-white">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 font-heading font-bold text-white">Dati di contatto</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Nome e cognome *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Mario Rossi"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="mario@esempio.it"
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Telefono
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+39 333 1234567"
                  className={inputClass}
                  autoComplete="tel"
                />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 font-heading font-bold text-white">Indirizzo di spedizione</h2>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Indirizzo *
                </label>
                <input
                  required
                  type="text"
                  value={form.address}
                  onChange={set("address")}
                  placeholder="Via Roma, 1"
                  className={inputClass}
                  autoComplete="street-address"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    CittГ  *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={set("city")}
                    placeholder="Roma"
                    className={inputClass}
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    CAP *
                  </label>
                  <input
                    required
                    type="text"
                    pattern="[0-9]{5}"
                    value={form.zip}
                    onChange={set("zip")}
                    placeholder="00100"
                    className={inputClass}
                    autoComplete="postal-code"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Paese *
                  </label>
                  <select
                    required
                    value={form.country}
                    onChange={set("country")}
                    className={inputClass}
                    autoComplete="country"
                  >
                    <option value="IT" className="bg-[#111118]">рџ‡®рџ‡№ Italia</option>
                    <option value="DE" className="bg-[#111118]">рџ‡©рџ‡Є Germania</option>
                    <option value="FR" className="bg-[#111118]">рџ‡«рџ‡· Francia</option>
                    <option value="ES" className="bg-[#111118]">рџ‡Єрџ‡ё Spagna</option>
                    <option value="CH" className="bg-[#111118]">рџ‡Ёрџ‡­ Svizzera</option>
                    <option value="AT" className="bg-[#111118]">рџ‡¦рџ‡№ Austria</option>
                    <option value="NL" className="bg-[#111118]">рџ‡ірџ‡± Paesi Bassi</option>
                    <option value="BE" className="bg-[#111118]">рџ‡§рџ‡Є Belgio</option>
                    <option value="PT" className="bg-[#111118]">рџ‡µрџ‡№ Portogallo</option>
                    <option value="PL" className="bg-[#111118]">рџ‡µрџ‡± Polonia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Note per la consegna
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="Istruzioni opzionali per il corriere..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-border bg-surface p-6 h-fit">
          <h2 className="mb-4 font-heading font-bold text-white">Il tuo ordine</h2>
          <div className="space-y-2 text-sm text-zinc-400">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="line-clamp-1 pr-2">{item.name} Г— {item.quantity}</span>
                <span className="shrink-0 text-zinc-300 font-medium">
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
          <p className="mt-1 text-xs text-zinc-500">IVA inclusa</p>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-white px-6 py-3 font-semibold text-[#09090B] hover:bg-zinc-100 disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {loading ? "ElaborazioneвЂ¦" : `Conferma ordine вЂў ${total.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}`}
          </button>

          <Link
            href="/cart"
            className="mt-3 block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            в†ђ Modifica carrello
          </Link>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Transazione sicura e crittografata
          </p>
        </div>
      </form>
    </div>
  );
}