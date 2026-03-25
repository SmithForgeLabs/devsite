import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import BlogCard from "@/components/shared/BlogCard";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articoli, guide e notizie dal nostro team.",
  openGraph: { title: "Blog — DevSite", type: "website" },
};

const LIMIT = 9;

interface Props {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam, tag } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (tag) where.tags = { has: tag };

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      select: {
        id: true, slug: true, title: true, excerpt: true,
        featuredImage: true, publishedAt: true, tags: true,
        author: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-12">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">Blog</p>
        <h1 className="font-heading text-3xl font-extrabold text-white">Articoli & Guide</h1>
        <p className="mt-2 text-zinc-400">Articoli, guide e notizie dal nostro team</p>
        {tag && (
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-medium text-zinc-300">
              #{tag}
            </span>
            <a href="/blog" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
              Rimuovi filtro
            </a>
          </div>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              featuredImage={post.featuredImage}
              publishedAt={post.publishedAt?.toISOString() ?? null}
              tags={post.tags as string[]}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-zinc-700" strokeWidth={1} />
          <p className="text-lg text-zinc-400">Nessun articolo disponibile</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center items-center gap-2">
          {page > 1 && (
            <a
              href={`/blog?page=${page - 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
            >
              Precedente
            </a>
          )}
          <span className="text-sm text-zinc-500">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/blog?page=${page + 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
            >
              Successiva
            </a>
          )}
        </div>
      )}
    </div>
  );
}
