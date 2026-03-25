import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Public settings keys — safe to expose without authentication
const PUBLIC_KEYS = ["site_name", "tagline", "logo", "footer_text", "social_links", "seo_default_title", "seo_default_description", "seo_og_image"];

// GET /api/settings/public — no auth required, returns only public settings
export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: PUBLIC_KEYS } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({ settings: map });
}
