import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, seoTitle: true, seoDescription: true },
  });
  if (!page) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function PublicPageBySlug({ params }: Props) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, content: true },
  });

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <svg className="w-16 h-16 text-[#E4E4E2] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h1 className="font-heading text-2xl font-bold text-[#0D0D0F] mb-2">Nessun contenuto disponibile</h1>
        <p className="text-sm text-[#71717A]">Questa sezione è ancora vuota. Torna presto!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-heading text-3xl font-extrabold text-[#1A1A1A] mb-8">{page.title}</h1>
      {page.content ? (
        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="text-[#6B7280]">Nessun contenuto disponibile.</p>
      )}
    </div>
  );
}
