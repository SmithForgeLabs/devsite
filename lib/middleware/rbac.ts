import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type TokenPayload } from "@/lib/auth";

export type Role = "ADMIN" | "EDITOR" | "READER";

export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyAccessToken(token);
  }

  const cookieToken = req.cookies.get("access_token")?.value;
  if (cookieToken) {
    return verifyAccessToken(cookieToken);
  }

  return null;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, user: TokenPayload, ...args: any[]) => Promise<NextResponse>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    return handler(req, user, ...args);
  };
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withRoles(
  roles: Role[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: NextRequest, user: TokenPayload, ...args: any[]) => Promise<NextResponse>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (req: NextRequest, ...args: any[]) => Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    if (!roles.includes(user.role as Role)) {
      return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
    }

    return handler(req, user, ...args);
  };
}

export function isAdmin(user: TokenPayload): boolean {
  return user.role === "ADMIN";
}

export function isEditorOrAbove(user: TokenPayload): boolean {
  return user.role === "ADMIN" || user.role === "EDITOR";
}

import { ZodError } from "zod";

export function formatZodError(err: ZodError) {
  return err.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
}

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiValidationError(err: ZodError): NextResponse {
  return NextResponse.json({ error: "Dati non validi", details: formatZodError(err) }, { status: 422 });
}
