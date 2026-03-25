import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles } from "@/lib/middleware/rbac";
import { Prisma } from "@prisma/client";

export const GET = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const entityType = searchParams.get("entityType") ?? undefined;
    const action = searchParams.get("action") ?? undefined;

    const where: Prisma.ActivityLogWhereInput = {};
    if (entityType === "login") {
      where.action = "LOGIN";
    } else if (entityType) {
      where.entityType = entityType;
    }
    if (action) where.action = action as Prisma.ActivityLogWhereInput["action"];

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          user: { select: { id: true, email: true, name: true, avatar: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  }
);
