import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { upsertSettingsBulkSchema } from "@/lib/validations/schemas";
import { logActivity } from "@/lib/activity";
import { ZodError } from "zod";
import type { TokenPayload } from "@/lib/auth";

function fmtVal(v: unknown): string {
  if (v === undefined || v === null) return "(vuoto)";
  if (Array.isArray(v)) return `[${v.length} elementi]`;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

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

    // Fetch current values before updating (for change log)
    const existingRows = await prisma.setting.findMany({
      where: { key: { in: input.map((i) => i.key) } },
    });
    const oldMap = Object.fromEntries(existingRows.map((r) => [r.key, r.value as unknown]));

    await prisma.$transaction(
      input.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: value as Parameters<typeof prisma.setting.upsert>[0]["update"]["value"] },
          create: { key, value: value as Parameters<typeof prisma.setting.create>[0]["data"]["value"] },
        })
      )
    );

    // Build from→to change log
    const changes = input
      .map(({ key, value }) => {
        const oldStr = fmtVal(oldMap[key]);
        const newStr = fmtVal(value);
        if (oldMap[key] === undefined) return `${key}: (nuovo) → "${newStr}"`;
        if (oldStr === newStr) return null;
        return `${key}: "${oldStr}" → "${newStr}"`;
      })
      .filter((c): c is string => c !== null);

    // Bust ISR cache so frontend reflects new settings immediately
    revalidatePath("/", "layout");

    await logActivity(user.userId, "UPDATE", "settings", undefined, "Impostazioni", { changes });

    return NextResponse.json({ ok: true });
  }
);
