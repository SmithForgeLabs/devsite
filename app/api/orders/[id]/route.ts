import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { updateOrderStatusSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ id: string }> };

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!order) return apiError("Ordine non trovato", 404);

  // READER can only view their own orders
  const isEditor = user.role === "ADMIN" || user.role === "EDITOR";
  if (!isEditor && order.userId !== user.userId) {
    return apiError("Ordine non trovato", 404);
  }

  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] — update status (EDITOR+)
export const PATCH = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user, { params }: Params) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = updateOrderStatusSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return apiError("Ordine non trovato", 404);

    const updated = await prisma.order.update({ where: { id }, data: { status: input.status } });

    await logActivity(user.userId, "UPDATE", "order", id, `Ordine #${id.slice(-8)} → ${input.status}`);

    return NextResponse.json({ order: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, user, { params }: Params) => {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return apiError("Ordine non trovato", 404);

    await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
    await logActivity(user.userId, "DELETE", "order", id, `Ordine #${id.slice(-8)} annullato`);

    return NextResponse.json({ ok: true });
  }
);
