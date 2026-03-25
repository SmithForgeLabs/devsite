import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/rbac";

export const GET = withAuth(async (_req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser });
});
