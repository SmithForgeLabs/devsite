"use client";

import { useState } from "react";
import { Star, Send, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

interface ReviewFormProps {
  productId?: string;
  postId?: string;
  onSuccess?: () => void;
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Valutazione">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${s} stelle`}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm"
        >
          <Star
            size={22}
            className={
              s <= (hovered || value)
                ? "text-amber-400 transition-colors"
                : "text-zinc-700 transition-colors"
            }
            fill={s <= (hovered || value) ? "currentColor" : "none"}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs text-zinc-400">
          {["", "Pessimo", "Scarso", "Nella media", "Buono", "Ottimo"][value]}
        </span>
      )}
    </div>
  );
}

export default function ReviewForm({ productId, postId, onSuccess }: ReviewFormProps) {
  const user = useAuthStore((s) => s.user);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success_approved" | "success_pending" | "error" | "ratelimit">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isForPost = !!postId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setErrorMsg("Scegli una valutazione da 1 a 5 stelle."); return; }
    if (content.trim().length < 5) { setErrorMsg("La recensione deve avere almeno 5 caratteri."); return; }
    if (!anonymous && !user && guestName.trim().length === 0) {
      setErrorMsg("Inserisci il tuo nome oppure pubblica come anonimo."); return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        rating,
        content: content.trim(),
        anonymous,
        authorName: anonymous ? undefined : user ? user.name : guestName.trim(),
      };
      if (productId) body.productId = productId;
      if (postId) body.postId = postId;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setStatus("ratelimit");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Si è verificato un errore. Riprova.");
        setStatus("error");
        return;
      }

      const data = await res.json();
      // If the review is auto-approved (product) vs pending (post)
      if (data.review?.status === "APPROVED") {
        setStatus("success_approved");
      } else {
        setStatus("success_pending");
      }

      setRating(0);
      setContent("");
      setGuestName("");
      setAnonymous(false);
      onSuccess?.();
    } catch {
      setStatus("error");
      setErrorMsg("Errore di rete. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success_approved" || status === "success_pending") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle size={28} className="text-emerald-400" />
          <p className="font-semibold text-white">Grazie per la tua recensione!</p>
          {status === "success_pending" ? (
            <p className="text-sm text-zinc-400">
              La tua recensione è in attesa di approvazione da parte dello staff.
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              La tua recensione è stata pubblicata.
            </p>
          )}
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Scrivi un&apos;altra recensione
          </button>
        </div>
      </div>
    );
  }

  if (status === "ratelimit") {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle size={28} className="text-amber-400" />
          <p className="font-semibold text-white">Troppe recensioni</p>
          <p className="text-sm text-zinc-400">
            Hai inviato troppe recensioni di recente. Riprova tra qualche minuto.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.04] p-6 space-y-5"
    >
      <h3 className="font-heading text-base font-semibold text-white">
        {isForPost ? "Lascia un commento / valutazione" : "Scrivi una recensione"}
      </h3>

      {/* Star rating */}
      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-400">Valutazione *</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="review-content" className="mb-2 block text-xs font-medium text-zinc-400">
          La tua recensione *
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={isForPost ? "Condividi la tua opinione sull'articolo…" : "Descrivi la tua esperienza con questo prodotto…"}
          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-none"
        />
        <p className="mt-1 text-right text-[10px] text-zinc-600">{content.length}/1000</p>
      </div>

      {/* Anonymous toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <div
            className={`w-9 h-5 rounded-full transition-colors ${anonymous ? "bg-indigo-600" : "bg-white/10"}`}
          />
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${anonymous ? "translate-x-4" : "translate-x-0"}`}
          />
        </div>
        <span className="text-sm text-zinc-400">Pubblica come anonimo</span>
      </label>

      {/* Name field — shown if not anonymous */}
      {!anonymous && (
        <div>
          {user ? (
            <p className="text-xs text-zinc-500">
              Pubblicazione come <span className="text-zinc-300 font-medium">{user.name}</span>
            </p>
          ) : (
            <>
              <label htmlFor="guest-name" className="mb-2 block text-xs font-medium text-zinc-400">
                Il tuo nome *
              </label>
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={60}
                placeholder="Nome da mostrare"
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
              <p className="mt-1.5 text-[11px] text-zinc-600">
                Hai un account?{" "}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  Accedi
                </Link>{" "}
                per pubblicare con il tuo profilo.
              </p>
            </>
          )}
        </div>
      )}

      {/* Pending notice for blog posts */}
      {isForPost && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300/80">
          I commenti agli articoli sono soggetti a moderazione da parte dello staff prima della pubblicazione.
        </p>
      )}

      {/* Error */}
      {(status === "error" || errorMsg) && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={13} />
          {errorMsg || "Si è verificato un errore."}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Send size={14} />
        )}
        {loading ? "Invio in corso…" : "Invia recensione"}
      </button>
    </form>
  );
}
