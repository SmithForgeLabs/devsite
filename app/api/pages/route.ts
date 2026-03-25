import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { createPageSchema } from "@/lib/validations/schemas";
import { addNavItem } from "@/lib/nav/navItems";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "pages-list", rateLimits.api);
  if (limited) return limited;

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const user = await import("@/lib/middleware/rbac").then(m => m.getAuthUser(req));
  const isEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  const statusFilter = !isEditor
    ? { status: "PUBLISHED" as const }
    : statusParam && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(statusParam)
      ? { status: statusParam as "PUBLISHED" | "DRAFT" | "ARCHIVED" }
      : {};

  const where = {
    ...statusFilter,
    ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] } : {}),
  };

  const [pages, total] = await Promise.all([
    prisma.page.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, slug: true, title: true, type: true, status: true, createdAt: true },
    }),
    prisma.page.count({ where }),
  ]);

  return NextResponse.json({ pages, total, page, limit });
}

export const POST = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = createPageSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const exists = await prisma.page.findUnique({ where: { slug: input.slug } });
    if (exists) return apiError("Slug già in uso", 409);

    const page = await prisma.page.create({ data: input });

    // Auto-add to navigation if published
    if (page.status === "PUBLISHED") {
      await addNavItem({ label: page.title, href: "/" + page.slug, type: "link" });
    }

    await logActivity(user.userId, page.status === "PUBLISHED" ? "PUBLISH" : "CREATE", "page", page.id, page.title);

    return NextResponse.json({ page }, { status: 201 });
  }
);
