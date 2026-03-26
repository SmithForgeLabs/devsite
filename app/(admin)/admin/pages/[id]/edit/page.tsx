import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageEditor from "@/components/admin/editor/PageEditor";
import CodePageEditor from "@/components/admin/editor/CodePageEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id }, select: { title: true } });
  return { title: page ? `Modifica: ${page.title} — Admin` : "Pagina non trovata" };
}

type EditablePageType = "LANDING" | "PORTFOLIO" | "BLOG" | "SHOP" | "HOME" | "CUSTOM" | "CODE";

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });

  if (!page) notFound();

  const pageType = page.type as EditablePageType;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Modifica pagina</h1>
      {pageType === "CODE" ? (
        <CodePageEditor
          pageId={page.id}
          initialData={{
            id: page.id,
            title: page.title,
            slug: page.slug,
            content: page.content,
            status: page.status as "DRAFT" | "PUBLISHED",
            seoTitle: page.seoTitle ?? "",
            seoDescription: page.seoDescription ?? "",
          }}
        />
      ) : (
        <PageEditor
          pageId={page.id}
          initialData={{
            id: page.id,
            title: page.title,
            slug: page.slug,
            content: page.content,
            type: pageType,
            status: page.status as "DRAFT" | "PUBLISHED",
            seoTitle: page.seoTitle ?? "",
            seoDescription: page.seoDescription ?? "",
          }}
        />
      )}
    </div>
  );
}
