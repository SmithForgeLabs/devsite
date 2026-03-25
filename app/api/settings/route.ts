import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { upsertSettingsBulkSchema } from "@/lib/validations/schemas";
import { logActivity } from "@/lib/activity";
import { ZodError } from "zod";
import type { TokenPayload } from "@/lib/auth";

const PUBLIC_KEYS = ["site_name", "tagline", "logo", "footer_text", "social_links"];

export const GET = withRoles(
  ["ADMIN"],
  async () => {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json({ settings: map });
  }
);

export const PUT = withRoles(
  ["ADMIN"],
  async (req: NextRequest, user: TokenPayload) => {
    let body: unknown;
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    let input: { key: string; value: unknown }[];
    try { input = upsertSettingsBulkSchema.parse(body) as { key: string; value: unknown }[]; }
    catch (err) {
      if (err instanceof ZodError) return apiValidationError(err);
      return apiError("Dati non validi", 422);
    }

    await prisma.$transaction(
      input.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: value as Parameters<typeof prisma.setting.upsert>[0]["update"]["value"] },
          create: { key, value: value as Parameters<typeof prisma.setting.create>[0]["data"]["value"] },
        })
      )
    );

    // Log the keys that were changed
    const changedKeys = input.map((i) => i.key).join(", ");
    await logActivity(user.userId, "UPDATE", "settings", undefined, changedKeys);

    return NextResponse.json({ ok: true });
  }
);
