import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, apiError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { storage } from "@/lib/storage";

const ALLOWED_MIME_TYPES: Record<string, "IMAGE" | "VIDEO" | "FILE"> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/gif": "IMAGE",
  "image/svg+xml": "IMAGE",
  "video/mp4": "VIDEO",
  "video/webm": "VIDEO",
  "application/pdf": "FILE",
  "application/zip": "FILE",
  "text/plain": "FILE",
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "media-upload", rateLimits.upload);
  if (limited) return limited;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("Form data non valido", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return apiError("Nessun file fornito", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError("File troppo grande (max 50 MB)", 413);
  }

  const mimeType = file.type || "application/octet-stream";
  const mimeCategory = ALLOWED_MIME_TYPES[mimeType];
  if (!mimeCategory) {
    return apiError("Tipo di file non supportato", 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await storage.upload(buffer, { originalName: file.name, mimeType });
  const { storageKey } = result;

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "";
  const url = `${baseUrl}/api/media/${encodeURIComponent(storageKey)}`;

  const media = await prisma.media.create({
    data: {
      filename: storageKey,
      originalName: file.name,
      mimeType,
      mimeCategory,
      size: file.size,
      storageKey,
      url,
      uploadedBy: user.userId,
    },
  });

  return NextResponse.json({ media }, { status: 201 });
}
