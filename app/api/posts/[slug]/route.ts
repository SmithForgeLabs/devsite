import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { updatePostSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { sanitizeHtml } from "@/lib/sanitize";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const user = await getAuthUser(req);
  const isEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  const post = await prisma.post.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { author: { select: { id: true, email: true } } },
  });

  if (!post) return apiError("Articolo non trovato", 404);
  if (post.status === "DRAFT" && !isEditor) return apiError("Articolo non trovato", 404);

  return NextResponse.json({ post });
}

export const PUT = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = updatePostSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const post = await prisma.post.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
    if (!post) return apiError("Articolo non trovato", 404);

    // EDITOR can only edit their own posts; ADMIN can edit any
    if (user.role === "EDITOR" && post.authorId !== user.userId) {
      return apiError("Permessi insufficienti", 403);
    }

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        ...input,
        ...(input.content ? { content: sanitizeHtml(input.content) } : {}),
        ...(input.publishedAt !== undefined
          ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
          : {}),
      },
    });

    const action = input.status === "PUBLISHED" && post.status !== "PUBLISHED" ? "PUBLISH"
      : input.status && input.status !== post.status && input.status !== "PUBLISHED" ? "UNPUBLISH"
      : "UPDATE";

    const changes: string[] = [];
    if (input.title && input.title !== post.title) changes.push(`titolo: "${post.title}" → "${input.title}"`);
    if (input.status && input.status !== post.status) changes.push(`stato: ${post.status} → ${input.status}`);
    if (input.excerpt !== undefined && input.excerpt !== post.excerpt) changes.push("riepilogo aggiornato");
    if (input.content !== undefined) changes.push("contenuto modificato");
    if (input.tags !== undefined) changes.push("tag aggiornati");

    await logActivity(user.userId, action, "post", updated.id, updated.title, changes.length > 0 ? { changes } : undefined);

    return NextResponse.json({ post: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, user, { params }: Params) => {
    const { slug } = await params;
    const post = await prisma.post.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
    if (!post) return apiError("Articolo non trovato", 404);

    await prisma.post.delete({ where: { id: post.id } });
    await logActivity(user.userId, "DELETE", "post", post.id, post.title);
    return NextResponse.json({ ok: true });
  }
);
