import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { createPostSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { sanitizeHtml } from "@/lib/sanitize";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "posts-list", rateLimits.api);
  if (limited) return limited;

  const user = await getAuthUser(req);
  const isEditor = user?.role === "ADMIN" || user?.role === "EDITOR";

  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  const statusFilter = !isEditor
    ? { status: "PUBLISHED" as const }
    : statusParam && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(statusParam)
      ? { status: statusParam as "PUBLISHED" | "DRAFT" | "ARCHIVED" }
      : {};

  const searchFilter =
    isEditor && searchParam
      ? {
          OR: [
            { title: { contains: searchParam, mode: "insensitive" as const } },
            { slug: { contains: searchParam, mode: "insensitive" as const } },
          ],
        }
      : {};

  const where = {
    ...statusFilter,
    ...(tag ? { tags: { has: tag } } : {}),
    ...searchFilter,
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, slug: true, title: true, status: true,
        tags: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, email: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export const POST = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = createPostSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const exists = await prisma.post.findUnique({ where: { slug: input.slug } });
    if (exists) return apiError("Slug già in uso", 409);

    const safeContent = sanitizeHtml(input.content);

    const post = await prisma.post.create({
      data: {
        ...input,
        content: safeContent,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        authorId: user.userId,
      },
    });

    await logActivity(user.userId, input.status === "PUBLISHED" ? "PUBLISH" : "CREATE", "post", post.id, post.title);

    return NextResponse.json({ post }, { status: 201 });
  }
);
