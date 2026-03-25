import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/editor/ProductEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Modifica: ${product.name} — Admin` : "Prodotto non trovato" };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Modifica prodotto</h1>
      <ProductEditor
        productId={product.id}
        initialData={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price: Number(product.price),
          stock: product.stock,
          status: product.status as "DRAFT" | "PUBLISHED",
          images: product.images as string[],
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          categoryIds: product.categoryId ? [product.categoryId] : [],
        }}
      />
    </div>
  );
}
