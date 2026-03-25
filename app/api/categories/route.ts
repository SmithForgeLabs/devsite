import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { createCategorySchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "categories", rateLimits.api);
  if (limited) return limited;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        include: { children: { orderBy: { name: "asc" } } },
      },
    },
    where: { parentId: null }, // only top-level; children nested above
  });

  return NextResponse.json({ categories });
}

export const POST = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = createCategorySchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const exists = await prisma.category.findUnique({ where: { slug: input.slug } });
    if (exists) return apiError("Slug già in uso", 409);

    const category = await prisma.category.create({ data: input });
    return NextResponse.json({ category }, { status: 201 });
  }
);
