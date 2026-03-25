import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { updatePageSchema, updateBlocksSchema } from "@/lib/validations/schemas";
import { addNavItem } from "@/lib/nav/navItems";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ slug: string }> };

async function resolvePage(slugOrId: string) {
  return prisma.page.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
  });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { blocks: { orderBy: { order: "asc" } } },
  });

  if (!page) return apiError("Pagina non trovata", 404);
  return NextResponse.json({ page });
}

export const PUT = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    const { blocks, ...rest } = body as Record<string, unknown>;

    let pageData;
    try { pageData = updatePageSchema.parse(rest); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const page = await resolvePage(slug);
    if (!page) return apiError("Pagina non trovata", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPage = await tx.page.update({ where: { id: page.id }, data: pageData });

      if (Array.isArray(blocks)) {
        let blocksData;
        try { blocksData = updateBlocksSchema.parse(blocks); }
        catch { return updatedPage; }

        await tx.block.deleteMany({ where: { pageId: page.id } });
        await tx.block.createMany({
          data: blocksData.map((b) => ({ ...b, pageId: page.id, content: b.content as Prisma.InputJsonValue })),
        });
      }

      return updatedPage;
    });

    // Auto-add to nav when status changes to PUBLISHED
    if (updated.status === "PUBLISHED" && page.status !== "PUBLISHED") {
      await addNavItem({ label: updated.title, href: "/" + updated.slug, type: "link" });
    }

    const action = pageData.status === "PUBLISHED" && page.status !== "PUBLISHED" ? "PUBLISH"
      : pageData.status && pageData.status !== page.status && pageData.status !== "PUBLISHED" ? "UNPUBLISH"
      : "UPDATE";

    const changes: string[] = [];
    if (pageData.title && pageData.title !== page.title) changes.push(`titolo: "${page.title}" → "${pageData.title}"`);
    if (pageData.status && pageData.status !== page.status) changes.push(`stato: ${page.status} → ${pageData.status}`);
    if (pageData.slug && pageData.slug !== page.slug) changes.push(`slug: ${page.slug} → ${pageData.slug}`);
    if (pageData.content !== undefined) changes.push("contenuto modificato");

    await logActivity(user.userId, action, "page", updated.id, updated.title, changes.length > 0 ? { changes } : undefined);

    return NextResponse.json({ page: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    const page = await resolvePage(slug);
    if (!page) return apiError("Pagina non trovata", 404);

    await prisma.page.delete({ where: { id: page.id } });
    await logActivity(user.userId, "DELETE", "page", page.id, page.title);
    return NextResponse.json({ ok: true });
  }
);
