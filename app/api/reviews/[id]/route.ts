import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles } from "@/lib/middleware/rbac";
import { logActivity } from "@/lib/activity";
import type { TokenPayload } from "@/lib/auth";

// PATCH /api/reviews/[id] — admin approve or reject
export const PATCH = withRoles(["ADMIN", "EDITOR"], async (req: NextRequest, user: TokenPayload, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const body = await req.json();
  const status = body?.status;
  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "Status deve essere APPROVED o REJECTED" }, { status: 400 });
  }
  try {
    const review = await prisma.review.update({ where: { id }, data: { status } });
    await logActivity(user.userId, status === "APPROVED" ? "PUBLISH" : "UPDATE", "review", id, review.authorName ?? "Anonimo");
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Recensione non trovata" }, { status: 404 });
  }
});

// DELETE /api/reviews/[id] — admin delete
export const DELETE = withRoles(["ADMIN"], async (_req: NextRequest, user: TokenPayload, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  try {
    const review = await prisma.review.findUnique({ where: { id }, select: { authorName: true } });
    await prisma.review.delete({ where: { id } });
    await logActivity(user.userId, "DELETE", "review", id, review?.authorName ?? "Anonimo");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Recensione non trovata" }, { status: 404 });
  }
});
