"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  id: string;
  categoryTag: string;
  title: string;
  description: string | null;
  icon: string;
  href: string | null;
  color: string;
  order: number;
}

interface FeatureCardsGridProps {
  cards: FeatureCard[];
  enableSpotlight?: boolean;
}

function BentoCard({ card, enableSpotlight }: { card: FeatureCard; enableSpotlight: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  // Resolve icon from Lucide icon name string
  const IconComponent = (
    (LucideIcons as unknown as Record<string, LucideIcon>)[card.icon] ??
    (LucideIcons as unknown as Record<string, LucideIcon>)["Star"]
  ) as LucideIcon;

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enableSpotlight || !spotRef.current || !cardRef.current) return;
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        if (!spotRef.current || !cardRef.current) { ticking.current = false; return; }
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(99,102,241,0.12), transparent 65%)`;
        ticking.current = false;
      });
    },
    [enableSpotlight]
  );

  const onMouseLeave = useCallback(() => {
    if (spotRef.current) spotRef.current.style.background = "transparent";
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !enableSpotlight) return;
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [enableSpotlight, onMouseMove, onMouseLeave]);

  const inner = (
    <div
      ref={cardRef}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/[0.18] hover:scale-[1.015] cursor-pointer"
      style={{ backgroundColor: "#080814", minHeight: 180 }}
    >
      {/* Spotlight layer */}
      <div ref={spotRef} className="pointer-events-none absolute inset-0 transition-opacity duration-300" aria-hidden />

      {/* Border glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(99,102,241,0.3), 0 0 24px 0 rgba(99,102,241,0.08)`,
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 p-5 flex flex-col gap-3 h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          {/* Category tag */}
          <span className="inline-block rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {card.categoryTag}
          </span>
          {/* Icon */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${card.color}22`, color: card.color }}
          >
            <IconComponent size={17} strokeWidth={1.8} />
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading text-base font-bold leading-snug text-white">
          {card.title}
        </h3>

        {/* Description */}
        {card.description && (
          <p className="text-xs leading-relaxed text-zinc-500 flex-1">
            {card.description}
          </p>
        )}
      </div>
    </div>
  );

  if (card.href) {
    return (
      <Link href={card.href} className="contents">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function FeatureCardsGrid({ cards, enableSpotlight = true }: FeatureCardsGridProps) {
  if (cards.length === 0) return null;

  // Bento layout: first card wide, rest auto
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className={i === 0 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}
        >
          <BentoCard card={card} enableSpotlight={enableSpotlight} />
        </div>
      ))}
    </div>
  );
}
