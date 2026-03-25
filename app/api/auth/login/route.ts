import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "login", rateLimits.auth);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Corpo della richiesta non valido", 400);
  }

  let input;
  try {
    input = loginSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) return apiValidationError(err);
    return apiError("Dati non validi", 422);
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Run bcrypt even when user doesn't exist to prevent timing-based user enumeration
  const dummyHash = "$2a$12$notarealhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  const isValid = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : (await bcrypt.compare(input.password, dummyHash), false);

  if (!user || !isValid) {
    return apiError("Email o password non validi", 401);
  }

  const payload = { userId: user.id, role: user.role };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  await setAuthCookies(accessToken, refreshToken);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  });
}
