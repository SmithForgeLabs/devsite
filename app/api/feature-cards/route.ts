import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles } from "@/lib/middleware/rbac";
import { logActivity } from "@/lib/activity";
import type { TokenPayload } from "@/lib/auth";
import { z } from "zod";

const CreateSchema = z.object({
  categoryTag: z.string().min(1).max(40),
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  icon: z.string().min(1).max(50).default("Star"),
  href: z.string().url().optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366F1"),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const all = searchParams.get("all") === "1";

  if (all) {
    const { getAuthUser } = await import("@/lib/middleware/rbac");
    const authUser = await getAuthUser(req);
    if (!authUser || !["ADMIN", "EDITOR"].includes(authUser.role)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    const cards = await prisma.featureCard.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ cards });
  }

  const cards = await prisma.featureCard.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(cards);
}

export const POST = withRoles(["ADMIN", "EDITOR"], async (req: NextRequest, user: TokenPayload) => {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi", details: parsed.error.flatten() }, { status: 400 });
  }

  const card = await prisma.featureCard.create({ data: parsed.data });
  await logActivity(user.userId, "CREATE", "featureCard", card.id, card.title);
  return NextResponse.json(card, { status: 201 });
});
