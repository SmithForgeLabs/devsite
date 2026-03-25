import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { updateProductSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const user = await getAuthUser(req);
  const isEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  const product = await prisma.product.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) return apiError("Prodotto non trovato", 404);
  if (product.status === "DRAFT" && !isEditor) return apiError("Prodotto non trovato", 404);

  return NextResponse.json({ product });
}

export const PUT = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = updateProductSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const product = await prisma.product.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
    if (!product) return apiError("Prodotto non trovato", 404);

    const updated = await prisma.product.update({ where: { id: product.id }, data: input });

    const action = input.status === "PUBLISHED" && product.status !== "PUBLISHED" ? "PUBLISH"
      : input.status && input.status !== product.status && input.status !== "PUBLISHED" ? "UNPUBLISH"
      : "UPDATE";

    const changes: string[] = [];
    if (input.name && input.name !== product.name) changes.push(`nome: "${product.name}" → "${input.name}"`);
    if (input.status && input.status !== product.status) changes.push(`stato: ${product.status} → ${input.status}`);
    if (input.price !== undefined && String(input.price) !== String(product.price)) changes.push(`prezzo aggiornato`);
    if (input.description !== undefined) changes.push("descrizione modificata");
    if (input.categoryId !== undefined && input.categoryId !== product.categoryId) changes.push("categoria aggiornata");

    await logActivity(user.userId, action, "product", updated.id, updated.name, changes.length > 0 ? { changes } : undefined);

    return NextResponse.json({ product: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    const product = await prisma.product.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
    if (!product) return apiError("Prodotto non trovato", 404);

    await prisma.product.delete({ where: { id: product.id } });
    await logActivity(user.userId, "DELETE", "product", product.id, product.name);
    return NextResponse.json({ ok: true });
  }
);
