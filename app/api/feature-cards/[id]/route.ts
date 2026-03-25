import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles } from "@/lib/middleware/rbac";
import { logActivity } from "@/lib/activity";
import type { TokenPayload } from "@/lib/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  categoryTag: z.string().min(1).max(40).optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().min(1).max(50).optional(),
  href: z.string().url().optional().or(z.literal("")).nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const PATCH = withRoles(["ADMIN", "EDITOR"], async (req: NextRequest, user: TokenPayload, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  try {
    const card = await prisma.featureCard.update({ where: { id }, data: parsed.data });
    await logActivity(user.userId, "UPDATE", "featureCard", card.id, card.title);
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ error: "Card non trovata" }, { status: 404 });
  }
});

export const DELETE = withRoles(["ADMIN", "EDITOR"], async (_req: NextRequest, user: TokenPayload, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  try {
    const card = await prisma.featureCard.findUnique({ where: { id }, select: { title: true } });
    await prisma.featureCard.delete({ where: { id } });
    await logActivity(user.userId, "DELETE", "featureCard", id, card?.title ?? id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Card non trovata" }, { status: 404 });
  }
});
