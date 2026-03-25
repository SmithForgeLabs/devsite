import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { updateUserSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/users/[id] — ADMIN can view any; others can only view self

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  if (user.role !== "ADMIN" && user.userId !== id) {
    return apiError("Permessi insufficienti", 403);
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
  });
  if (!target) return apiError("Utente non trovato", 404);

  return NextResponse.json({ user: target });
}

// PATCH /api/users/[id] — ADMIN can update any; others can only update self
export const PATCH = withRoles(
  ["ADMIN", "EDITOR", "READER"],
  async (req: NextRequest, authUser, { params }: Params) => {
    const { id } = await params;

    if (authUser.role !== "ADMIN" && authUser.userId !== id) {
      return apiError("Permessi insufficienti", 403);
    }

    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = updateUserSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    if (input.role !== undefined && authUser.role !== "ADMIN") {
      return apiError("Solo l'amministratore può cambiare i ruoli", 403);
    }

    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return apiError("Utente non trovato", 404);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        avatar: input.avatar,
        ...(authUser.role === "ADMIN" && input.role ? { role: input.role } : {}),
      },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    return NextResponse.json({ user: updated });
  }
);

export const DELETE = withRoles(
  ["ADMIN"],
  async (_req: NextRequest, authUser, { params }: Params) => {
    const { id } = await params;

    if (authUser.userId === id) {
      return apiError("Non puoi eliminare il tuo stesso account", 400);
    }

    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return apiError("Utente non trovato", 404);

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
);
