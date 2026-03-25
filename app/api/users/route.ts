import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { updateUserSchema } from "@/lib/validations/schemas";
import { z, ZodError } from "zod";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "users-list", rateLimits.api);
  if (limited) return limited;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  if (user.role !== "ADMIN") {
    const self = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    });
    return NextResponse.json({ users: self ? [self] : [], total: 1 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role");

  const validRoles = ["ADMIN", "EDITOR", "READER"] as const;
  type UserRole = (typeof validRoles)[number];

  const where = {
    ...(search ? { email: { contains: search, mode: "insensitive" as const } } : {}),
    ...(role && validRoles.includes(role as UserRole) ? { role: role as UserRole } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

export const PATCH = withRoles(
  ["ADMIN", "EDITOR", "READER"],
  async (req: NextRequest, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = updateUserSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    // Only ADMIN can change roles
    if (input.role !== undefined && user.role !== "ADMIN") {
      return apiError("Solo l'amministratore può cambiare i ruoli", 403);
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        name: input.name,
        avatar: input.avatar,
        ...(user.role === "ADMIN" && input.role ? { role: input.role } : {}),
      },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    return NextResponse.json({ user: updated });
  }
);

const adminCreateUserSchema = z.object({
  email: z.string().email().max(254).transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  name: z.string().max(200).optional(),
  role: z.enum(["ADMIN", "EDITOR", "READER"]).default("READER"),
});

export const POST = withRoles(
  ["ADMIN"],
  async (req: NextRequest) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input;
    try { input = adminCreateUserSchema.parse(body); }
    catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return apiError("Email già in uso", 409);

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: { email: input.email, name: input.name ?? null, passwordHash, role: input.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  }
);
