import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, apiError } from "@/lib/middleware/rbac";
import { storage } from "@/lib/storage";

type KeyParams = { params: Promise<{ key: string }> };

export async function GET(_req: NextRequest, { params }: KeyParams) {
  const { key } = await params;
  const storageKey = decodeURIComponent(key);

  const media = await prisma.media.findFirst({ where: { storageKey } });
  if (!media) return apiError("File non trovato", 404);

  const exists = await storage.exists(storageKey);
  if (!exists) return apiError("File non trovato nello storage", 404);

  const buffer = await storage.getBuffer(storageKey);
  if (!buffer) return apiError("File non trovato nello storage", 404);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${encodeURIComponent(media.originalName)}"`,
    },
  });
}

export const DELETE = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, user, { params }: KeyParams) => {
    const { key } = await params;
    const storageKey = decodeURIComponent(key);

    const media = await prisma.media.findFirst({ where: { storageKey } });
    if (!media) return apiError("File non trovato", 404);

    // EDITOR can only delete their own uploads; ADMIN can delete any
    if (user.role === "EDITOR" && media.uploadedBy !== user.userId) {
      return apiError("Permessi insufficienti", 403);
    }

    // Delete from storage (best-effort — don't fail if already removed)
    try { await storage.delete(storageKey); } catch { /* file may not exist */ }

    await prisma.media.delete({ where: { id: media.id } });
    return NextResponse.json({ ok: true });
  }
);

// PATCH /api/media/[key] — update alt/caption (EDITOR+)
export const PATCH = withRoles(
  ["ADMIN", "EDITOR"],
  async (req: NextRequest, _user, { params }: KeyParams) => {
    const { key } = await params;
    const storageKey = decodeURIComponent(key);

    const media = await prisma.media.findFirst({ where: { storageKey } });
    if (!media) return apiError("File non trovato", 404);

    let body: { alt?: string; caption?: string };
    try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

    const updated = await prisma.media.update({
      where: { id: media.id },
      data: {
        alt: typeof body.alt === "string" ? body.alt.slice(0, 500) : undefined,
        caption: typeof body.caption === "string" ? body.caption.slice(0, 1000) : undefined,
      },
    });

    return NextResponse.json({ media: updated });
  }
);
