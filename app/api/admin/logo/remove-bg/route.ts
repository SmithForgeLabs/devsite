import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";
import { withRoles } from "@/lib/middleware/rbac";
import { storage } from "@/lib/storage";

export const POST = withRoles(["ADMIN"], async (req: NextRequest) => {
  let body: { logoUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const logoUrl = body.logoUrl;
  if (!logoUrl || typeof logoUrl !== "string") {
    return NextResponse.json({ error: "logoUrl mancante" }, { status: 400 });
  }

  // Resolve the image buffer — either from local storage or external URL
  let inputBuffer: Buffer;

  if (logoUrl.startsWith("/uploads/")) {
    const storageKey = logoUrl.replace("/uploads/", "");
    const buf = await storage.getBuffer(storageKey);
    if (!buf) {
      return NextResponse.json({ error: "File non trovato nello storage" }, { status: 404 });
    }
    inputBuffer = buf;
  } else {
    // External URL — fetch it
    try {
      const res = await fetch(logoUrl);
      if (!res.ok) throw new Error("Fetch fallito");
      inputBuffer = Buffer.from(await res.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Impossibile scaricare l'immagine" }, { status: 400 });
    }
  }

  // Run background removal (local ONNX model)
  const resultBlob = await removeBackground(new Blob([new Uint8Array(inputBuffer)]), {
    output: { format: "image/png" },
  });

  const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

  // Save the result via storage service
  const uploaded = await storage.upload(resultBuffer, {
    originalName: "logo-nobg.png",
    mimeType: "image/png",
    folder: "logos",
  });

  return NextResponse.json({ url: uploaded.url, storageKey: uploaded.storageKey });
});
