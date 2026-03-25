import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "I nostri lavori e progetti realizzati.",
};

export default async function PortfolioPage() {
  const pages = await prisma.page.findMany({
    where: { type: "PORTFOLIO", status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, seoDescription: true },
  });

  const portfolioItems = await Promise.all(
    pages.map(async (page) => {
      const block = await prisma.block.findFirst({
        where: { pageId: page.id },
        orderBy: { order: "asc" },
        select: { content: true },
      });
      const content = block?.content as Record<string, unknown> | null;
      return {
        ...page,
        coverImage: (content?.image ?? content?.featuredImage ?? null) as string | null,
        description: page.seoDescription ?? null,
      };
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-12 text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">Portfolio</p>
        <h1 className="font-heading text-3xl font-extrabold text-white">Progetti realizzati</h1>
        <p className="mt-2 text-zinc-400">I nostri lavori e progetti realizzati</p>
      </div>

      {portfolioItems.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioItems.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
                <div className="relative aspect-video overflow-hidden bg-white/[0.03]">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-700">
                    <Layers size={48} strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-heading font-semibold text-white transition-colors group-hover:text-zinc-300">
                  <Link href={`/${item.slug}`}>{item.title}</Link>
                </h2>
                {item.description && (
                  <p className="mt-2 text-sm text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
                )}
                <Link
                  href={`/${item.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  Visualizza progetto
                  <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Layers className="mx-auto mb-3 h-12 w-12 text-[#E5E5E3]" strokeWidth={1} />
          <p className="text-lg text-[#6B7280]">Nessun progetto disponibile al momento</p>
          <p className="text-sm mt-2 text-[#6B7280]/60">Torna presto!</p>
        </div>
      )}
    </div>
  );
}
