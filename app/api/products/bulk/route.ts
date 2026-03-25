import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { bulkActionSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

// PATCH /api/products/bulk (EDITOR+)
export const PATCH = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = bulkActionSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const { ids, action } = input;
    let affected = 0;

    if (action === "publish") {
      const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: "PUBLISHED" } });
      affected = result.count;
    } else if (action === "draft") {
      const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: "DRAFT" } });
      affected = result.count;
    } else if (action === "archive") {
      const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: "ARCHIVED" } });
      affected = result.count;
    } else if (action === "delete") {
      if (user.role !== "ADMIN") return apiError("Solo l'amministratore può eliminare i prodotti", 403);
      const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
      affected = result.count;
    }

    await logActivity(user.userId, action === "delete" ? "DELETE" : action === "publish" ? "PUBLISH" : "UPDATE", "product", undefined, `Bulk ${action}: ${affected} prodotti`);

    return NextResponse.json({ ok: true, affected });
  }
);

export { PATCH as POST };
