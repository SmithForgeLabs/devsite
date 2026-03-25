import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { detectDeviceFromUA, DEVICE_COOKIE, type DeviceType } from "@/lib/device/detectDevice";

const PUBLIC_FILE_REGEX = /\.(.*)$/;

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "fallback-dev-secret-CHANGE-IN-PRODUCTION"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "fallback-refresh-secret-CHANGE-IN-PRODUCTION"
);

interface JwtUser {
  userId: string;
  role: string;
}

async function verifyJwt(token: string, secret: Uint8Array): Promise<JwtUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JwtUser;
  } catch {
    return null;
  }
}

async function resolveUser(
  request: NextRequest
): Promise<{ user: JwtUser; newAccessToken: string | null } | null> {
  // 1. Try access token
  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken) {
    const user = await verifyJwt(accessToken, ACCESS_SECRET);
    if (user) return { user, newAccessToken: null };
  }

  // 2. Silent refresh via refresh token
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return null;

  const payload = await verifyJwt(refreshToken, REFRESH_SECRET);
  if (!payload) return null;

  const newAccessToken = await new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);

  return { user: payload, newAccessToken };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_FILE_REGEX.test(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const existingCookie = request.cookies.get(DEVICE_COOKIE)?.value as DeviceType | undefined;
  const userAgent = request.headers.get("user-agent") ?? "";
  const detectedDevice: DeviceType =
    existingCookie === "pc" || existingCookie === "phone"
      ? existingCookie
      : detectDeviceFromUA(userAgent);

  if (pathname.startsWith("/admin")) {
    const auth = await resolveUser(request);

    if (!auth) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Forward user info to Server Components via request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", auth.user.userId);
    requestHeaders.set("x-user-role", auth.user.role);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Persist refreshed access token in cookie
    if (auth.newAccessToken) {
      const isProduction = process.env.NODE_ENV === "production";
      response.cookies.set("access_token", auth.newAccessToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });
    }

    // Device cookie
    if (!existingCookie || existingCookie !== detectedDevice) {
      response.cookies.set(DEVICE_COOKIE, detectedDevice, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "strict",
        httpOnly: false,
      });
    }

    return response;
  }

  const response = NextResponse.next();
  if (!existingCookie || existingCookie !== detectedDevice) {
    response.cookies.set(DEVICE_COOKIE, detectedDevice, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "strict",
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
