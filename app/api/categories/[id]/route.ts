import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { createCategorySchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export const PUT = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, _user: unknown, { params }: Params) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    let data: { name: string; slug: string; parentId?: string | null };
    try {
      data = createCategorySchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) return apiValidationError(err);
      return apiError("Dati non validi", 400);
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return apiError("Categoria non trovata", 404);

    // Prevent circular reference (child cannot become its own parent)
    if (data.parentId && data.parentId === id) {
      return apiError("Una categoria non può essere padre di se stessa", 400);
    }

    const slugConflict = await prisma.category.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (slugConflict) return apiError("Slug già in uso", 409);

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId ?? null,
      },
    });

    return NextResponse.json({ category: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, _user: unknown, { params }: Params) => {
    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, products: true } } },
    });
    if (!existing) return apiError("Categoria non trovata", 404);

    if (existing._count.children > 0) {
      return apiError("Elimina prima le sottocategorie", 400);
    }
    if (existing._count.products > 0) {
      return apiError("Alcuni prodotti usano questa categoria", 400);
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }
);
