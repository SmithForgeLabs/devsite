import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("Non autorizzato", 401);
  if (user.role !== "ADMIN" && user.role !== "EDITOR") return apiError("Accesso negato", 403);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "40", 10)));
  const search = searchParams.get("search")?.trim() ?? "";
  const type = searchParams.get("type")?.toUpperCase();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: "insensitive" } },
      { alt: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type && ["IMAGE", "VIDEO", "FILE"].includes(type)) {
    where.mimeCategory = type;
  }

  const [total, media] = await Promise.all([
    prisma.media.count({ where }),
    prisma.media.findMany({
      where,
      select: {
        id: true,
        storageKey: true,
        url: true,
        filename: true,
        mimeType: true,
        mimeCategory: true,
        alt: true,
        caption: true,
        size: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ media, total, page, limit });
}
