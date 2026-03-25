import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import ProductCard from "@/components/shared/ProductCard";
import SortSelect from "@/components/shared/SortSelect";
import Link from "next/link";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Negozio",
  description: "Scopri tutti i nostri prodotti.",
};

const LIMIT = 12;

interface Props {
  searchParams: Promise<{ page?: string; category?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const { page: pageParam, category, sort } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

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
      skip: (page - 1) * LIMIT,
      take: LIMIT,
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

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <h1 className="mb-8 font-heading text-3xl font-extrabold text-white">Negozio</h1>

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Categorie
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/shop"
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    !category ? "bg-white/[0.08] font-medium text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  Tutti i prodotti
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop?category=${cat.slug}${sort ? `&sort=${sort}` : ""}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      category === cat.slug ? "bg-white/[0.08] font-medium text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-xs ${category === cat.slug ? "text-zinc-400" : "text-zinc-600"}`}>{cat._count.products}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {total} prodott{total === 1 ? "o" : "i"}
            </p>
            <SortSelect />
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
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
              {page > 1 && (
                <Link
                  href={`/shop?page=${page - 1}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/[0.08]"
                >
                  Precedente
                </Link>
              )}
              <span className="text-sm text-zinc-500">
                Pagina {page} di {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/shop?page=${page + 1}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
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
