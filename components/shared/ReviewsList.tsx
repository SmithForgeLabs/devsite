"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  authorName: string | null;
  createdAt: string;
}

interface ReviewsListProps {
  productId?: string;
  postId?: string;
  refreshKey?: number;
}

export default function ReviewsList({ productId, postId, refreshKey }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (postId) params.set("postId", postId);

    fetch(`/api/reviews?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, postId, refreshKey]);

  const filtered = filter ? reviews.filter((r) => r.rating === filter) : reviews;
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="py-4 text-sm text-zinc-500">
        Nessuna recensione ancora. Sii il primo a lasciarne una!
      </p>
    );
  }

  return (
    <div>
      {/* Summary + star filter */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:gap-8">
        {/* Average */}
        <div className="flex-shrink-0 text-center sm:border-r sm:border-white/[0.07] sm:pr-8">
          <p className="font-heading text-5xl font-black text-white">{avgRating.toFixed(1)}</p>
          <div className="mt-1.5 flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={s <= Math.round(avgRating) ? "text-amber-400" : "text-zinc-700"}
                fill={s <= Math.round(avgRating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{reviews.length} recensioni</p>
        </div>

        {/* Histogram + filters */}
        <div className="flex flex-1 flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            const isActive = filter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilter(isActive ? null : star)}
                className={`flex items-center gap-2.5 text-xs transition-opacity ${isActive ? "opacity-100" : "opacity-55 hover:opacity-90"}`}
              >
                <div className="flex w-16 items-center justify-end gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={9}
                      className={s <= star ? "text-amber-400" : "text-zinc-700"}
                      fill={s <= star ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-amber-400/70 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-zinc-500">{count}</span>
              </button>
            );
          })}
          {filter && (
            <button
              type="button"
              onClick={() => setFilter(null)}
              className="mt-1 text-left text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              × Rimuovi filtro
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {filtered.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
          >
            <div className="mb-2.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {review.authorName ?? "Anonimo"}
                </p>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      className={s <= review.rating ? "text-amber-400" : "text-zinc-700"}
                      fill={s <= review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>
              <p className="flex-shrink-0 text-xs text-zinc-600">
                {new Date(review.createdAt).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{review.content}</p>
          </div>
        ))}

        {filtered.length === 0 && filter && (
          <p className="py-4 text-center text-sm text-zinc-500">
            Nessuna recensione con {filter} stelle.
          </p>
        )}
      </div>
    </div>
  );
}
