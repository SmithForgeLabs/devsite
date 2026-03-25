import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  REFRESH_COOKIE,
} from "@/lib/auth";
import { apiError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "refresh", rateLimits.auth);
  if (limited) return limited;

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return apiError("Refresh token mancante", 401);
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return apiError("Refresh token non valido o scaduto", 401);
  }

  // Verify user still exists (might have been deleted)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return apiError("Utente non trovato", 401);
  }

  // Issue new token pair (rotation)
  const newPayload = { userId: user.id, role: user.role };
  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken(newPayload),
    signRefreshToken(newPayload),
  ]);

  await setAuthCookies(newAccessToken, newRefreshToken);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  });
}
