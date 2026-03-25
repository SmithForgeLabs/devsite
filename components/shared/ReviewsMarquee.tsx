"use client";

import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  authorName: string | null;
  createdAt: string;
}

interface ReviewsMarqueeProps {
  reviews: Review[];
}

function ReviewCard({ review }: { review: Review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const displayName = review.authorName ?? "Anonimo";

  return (
    <div
      className="relative flex-shrink-0 w-72 rounded-xl border border-white/10 bg-white/[0.04] p-5 mx-3 overflow-hidden"
      style={{ backdropFilter: "blur(12px)" }}
    >
      {/* Subtle gradient glow */}
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-1 mb-3">
        {stars.map((s) => (
          <Star
            key={s}
            size={13}
            className={s <= review.rating ? "text-amber-400" : "text-zinc-700"}
            fill={s <= review.rating ? "currentColor" : "none"}
          />
        ))}
      </div>

      <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 mb-3">
        &ldquo;{review.content}&rdquo;
      </p>

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
          {displayName[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-400">{displayName}</p>
          <p className="text-[10px] text-zinc-600">
            {new Date(review.createdAt).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsMarquee({ reviews }: ReviewsMarqueeProps) {
  if (reviews.length === 0) return null;

  // Repeat until we have enough cards to fill the animation smoothly
  const MIN = 8;
  let padded = [...reviews];
  while (padded.length < MIN) padded = [...padded, ...reviews];

  const row1 = [...padded, ...padded];
  const row2 = [...padded, ...padded].reverse();

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section className="relative overflow-hidden py-16 sm:py-20" style={{ backgroundColor: "#060610" }}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Header */}
      <div className="mx-auto mb-10 max-w-5xl px-4 text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">Recensioni</p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Cosa dicono i nostri clienti
        </h2>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={14} className="text-amber-400" fill="currentColor" />
            ))}
          </div>
          <span className="text-sm font-semibold text-white">{avgRating}</span>
          <span className="text-sm text-zinc-500">({reviews.length} recensioni)</span>
        </div>
      </div>

      {/* Row 1 - left */}
      <div className="relative mb-4">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#060610] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#060610] to-transparent z-10 pointer-events-none" />
        <div
          className="flex"
          style={{ animation: "var(--animate-marquee-left)", "--gap": "0px", "--duration": "35s" } as React.CSSProperties}
        >
          {row1.map((review, i) => (
            <ReviewCard key={`${review.id}-r1-${i}`} review={review} />
          ))}
        </div>
      </div>

      {/* Row 2 - right */}
      <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#060610] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#060610] to-transparent z-10 pointer-events-none" />
          <div
            className="flex"
            style={{ animation: "var(--animate-marquee-right)", "--gap": "0px", "--duration": "40s" } as React.CSSProperties}
          >
            {row2.map((review, i) => (
              <ReviewCard key={`${review.id}-r2-${i}`} review={review} />
            ))}
          </div>
        </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
}
