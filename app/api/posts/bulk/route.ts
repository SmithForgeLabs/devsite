import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { bulkActionSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

// PATCH /api/posts/bulk — WordPress-style bulk actions (EDITOR+)
export const PATCH = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = bulkActionSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const { ids, action } = input;

    // EDITOR can only bulk-action their own posts
    const where =
      user.role === "EDITOR"
        ? { id: { in: ids }, authorId: user.userId }
        : { id: { in: ids } };

    let affected = 0;
    if (action === "publish") {
      const result = await prisma.post.updateMany({
        where,
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      affected = result.count;
    } else if (action === "draft") {
      const result = await prisma.post.updateMany({ where, data: { status: "DRAFT" } });
      affected = result.count;
    } else if (action === "archive") {
      const result = await prisma.post.updateMany({ where, data: { status: "ARCHIVED" } });
      affected = result.count;
    } else if (action === "delete") {
      const result = await prisma.post.deleteMany({ where });
      affected = result.count;
    }

    await logActivity(user.userId, action === "delete" ? "DELETE" : action === "publish" ? "PUBLISH" : "UPDATE", "post", undefined, `Bulk ${action}: ${affected} articoli`);

    return NextResponse.json({ ok: true, affected });
  }
);

export { PATCH as POST };
