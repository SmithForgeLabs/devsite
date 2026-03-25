import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "register", rateLimits.auth);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Corpo della richiesta non valido", 400);
  }

  let input;
  try {
    input = registerSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    return apiError("Dati non validi", 422);
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return apiError("Email già in uso", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, role: "READER" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const payload = { userId: user.id, role: user.role };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  await setAuthCookies(accessToken, refreshToken);

  return NextResponse.json(
    { user: { id: user.id, email: user.email, role: user.role } },
    { status: 201 }
  );
}
