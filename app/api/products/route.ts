import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { createProductSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "products-list", rateLimits.api);
  if (limited) return limited;

  const user = await getAuthUser(req);
  const isEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category");
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));
  const sort = searchParams.get("sort") ?? "newest";

  const orderBy =
    sort === "priceAsc" ? { price: "asc" as const }
    : sort === "priceDesc" ? { price: "desc" as const }
    : { createdAt: "desc" as const };

  const statusFilter = !isEditor
    ? { status: "PUBLISHED" as const }
    : statusParam && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(statusParam)
      ? { status: statusParam as "PUBLISHED" | "DRAFT" | "ARCHIVED" }
      : {};

  const searchFilter =
    isEditor && searchParam
      ? {
          OR: [
            { name: { contains: searchParam, mode: "insensitive" as const } },
            { slug: { contains: searchParam, mode: "insensitive" as const } },
          ],
        }
      : {};

  const where = {
    ...statusFilter,
    ...(category ? { category: { slug: category } } : {}),
    ...searchFilter,
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}

export const POST = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = createProductSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const exists = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (exists) return apiError("Slug già in uso", 409);

    const product = await prisma.product.create({ data: input });
    await logActivity(user.userId, input.status === "PUBLISHED" ? "PUBLISH" : "CREATE", "product", product.id, product.name);
    return NextResponse.json({ product }, { status: 201 });
  }
);
