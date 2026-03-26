import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import BlogCard from "@/components/shared/BlogCard";
import ProductCard from "@/components/shared/ProductCard";
import SortSelect from "@/components/shared/SortSelect";
import { FileText, Package, Layers, ArrowRight } from "lucide-react";

const BLOG_LIMIT = 9;
const SHOP_LIMIT = 12;

interface Props {
  params: Promise<{ pageSlug: string }>;
  searchParams: Promise<{ page?: string; tag?: string; category?: string; sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageSlug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug: pageSlug, status: "PUBLISHED" },
    select: { title: true, seoTitle: true, seoDescription: true },
  });
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function PublicPageBySlug({ params, searchParams }: Props) {
  const { pageSlug } = await params;
  const sp = await searchParams;

  const page = await prisma.page.findFirst({
    where: { slug: pageSlug, status: "PUBLISHED" },
    select: { id: true, title: true, type: true, content: true, seoTitle: true, seoDescription: true },
  });

  if (!page) notFound();

  // ── BLOG listing ──────────────────────────────────────────────────────────
  if (page.type === "BLOG") {
    const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10));
    const tag = sp.tag;
    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (tag) where.tags = { has: tag };

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (currentPage - 1) * BLOG_LIMIT,
        take: BLOG_LIMIT,
        select: {
          id: true, slug: true, title: true, excerpt: true,
          featuredImage: true, publishedAt: true, tags: true,
          author: { select: { name: true } },
        },
      }),
    ]);
    const totalPages = Math.ceil(total / BLOG_LIMIT);

    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">Blog</p>
          <h1 className="font-heading text-3xl font-extrabold text-white">{page.title}</h1>
          {page.seoDescription && <p className="mt-2 text-zinc-400">{page.seoDescription}</p>}
          {tag && (
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-sm font-medium text-zinc-300">
                #{tag}
              </span>
              <Link href={`/${pageSlug}`} className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
                Rimuovi filtro
              </Link>
            </div>
          )}
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard
                key={post.id}
                slug={post.slug}
                pageSlug={pageSlug}
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
            {currentPage > 1 && (
              <Link
                href={`/${pageSlug}?page=${currentPage - 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
              >
                Precedente
              </Link>
            )}
            <span className="text-sm text-zinc-500">
              Pagina {currentPage} di {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/${pageSlug}?page=${currentPage + 1}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
              >
                Successiva
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── SHOP listing ──────────────────────────────────────────────────────────
  if (page.type === "SHOP") {
    const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10));
    const { category, sort } = sp;
    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (category) where.category = { slug: category };
    const orderBy: Record<string, string> =
      sort === "price_asc" ? { price: "asc" }
      : sort === "price_desc" ? { price: "desc" }
      : { createdAt: "desc" };

    const [total, products, categories] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (currentPage - 1) * SHOP_LIMIT,
        take: SHOP_LIMIT,
        select: {
          id: true, slug: true, name: true, price: true,
          images: true, stock: true,
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      }),
    ]);
    const totalPages = Math.ceil(total / SHOP_LIMIT);

    return (
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <h1 className="mb-8 font-heading text-3xl font-extrabold text-white">{page.title}</h1>
        <div className="flex flex-col gap-10 lg:flex-row">
          <aside className="w-full lg:w-56 shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Categorie</h2>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={`/${pageSlug}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${!category ? "bg-white/[0.08] font-medium text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    Tutti i prodotti
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${pageSlug}?category=${cat.slug}${sort ? `&sort=${sort}` : ""}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${category === cat.slug ? "bg-white/[0.08] font-medium text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-xs ${category === cat.slug ? "text-zinc-400" : "text-zinc-600"}`}>{cat._count.products}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="flex-1">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-zinc-400">{total} prodott{total === 1 ? "o" : "i"}</p>
              <SortSelect />
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    pageSlug={pageSlug}
                    name={p.name}
                    price={Number(p.price)}
                    images={p.images as string[]}
                    stock={p.stock}
                    category={p.category?.name}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-zinc-700" strokeWidth={1} />
                <p className="text-lg text-zinc-400">Nessun prodotto disponibile</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/${pageSlug}?page=${currentPage - 1}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
                  >
                    Precedente
                  </Link>
                )}
                <span className="text-sm text-zinc-500">Pagina {currentPage} di {totalPages}</span>
                {currentPage < totalPages && (
                  <Link
                    href={`/${pageSlug}?page=${currentPage + 1}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
                  >
                    Successiva
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PORTFOLIO gallery ─────────────────────────────────────────────────────
  if (page.type === "PORTFOLIO") {
    const pages = await prisma.page.findMany({
      where: { type: "PORTFOLIO", status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, title: true, seoDescription: true },
    });
    const portfolioItems = await Promise.all(
      pages.map(async (p) => {
        const block = await prisma.block.findFirst({
          where: { pageId: p.id },
          orderBy: { order: "asc" },
          select: { content: true },
        });
        const content = block?.content as Record<string, unknown> | null;
        return {
          ...p,
          coverImage: (content?.image ?? content?.featuredImage ?? null) as string | null,
          description: p.seoDescription ?? null,
        };
      })
    );

    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500/70">Portfolio</p>
          <h1 className="font-heading text-3xl font-extrabold text-white">{page.title}</h1>
          {page.seoDescription && <p className="mt-2 text-zinc-400">{page.seoDescription}</p>}
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
            <Layers className="mx-auto mb-3 h-12 w-12 text-zinc-700" strokeWidth={1} />
            <p className="text-lg text-zinc-400">Nessun progetto disponibile al momento</p>
            <p className="text-sm mt-2 text-zinc-600">Torna presto!</p>
          </div>
        )}
      </div>
    );
  }

  // ── CODE page — inject HTML/CSS/JS ────────────────────────────────────────
  if (page.type === "CODE") {
    let html = "";
    let css = "";
    let js = "";
    let fullscreen = false;
    try {
      const parsed = JSON.parse(page.content || "{}");
      html = parsed.html ?? "";
      css = parsed.css ?? "";
      js = parsed.js ?? "";
      fullscreen = parsed.fullscreen ?? false;
    } catch {
      // malformed JSON — just render nothing
    }

    return (
      <>
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
        <div
          className={fullscreen ? "fixed inset-0 z-50 overflow-auto bg-white" : ""}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {js && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{${js}}catch(e){console.error('CODE page script error:',e)}})();`,
            }}
          />
        )}
      </>
    );
  }

  // ── HOME / LANDING / CUSTOM — render content as HTML ─────────────────────
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-3xl font-extrabold text-white mb-8">{page.title}</h1>
      {page.content ? (
        <div
          className="prose prose-invert prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-zinc-400">Nessun contenuto disponibile.</p>
      )}
    </div>
  );
}
