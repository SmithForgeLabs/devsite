import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/middleware/rbac";
import { checkRateLimit } from "@/lib/middleware/rateLimit";
import { z } from "zod";
import crypto from "crypto";

const CreateSchema = z.object({
  productId: z.string().cuid().optional(),
  postId: z.string().cuid().optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(5).max(2000),
  anonymous: z.boolean().default(false),
  authorName: z.string().max(80).optional(),
}).refine((d) => d.productId || d.postId, {
  message: "È necessario specificare un prodotto o un articolo",
});

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.IP_HASH_SALT ?? "devsite-salt")).digest("hex").slice(0, 32);
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "reviews-get", { limit: 60, windowSec: 60 });
  if (limited) return limited;

  const { searchParams } = req.nextUrl;
  const isAdminQuery = searchParams.get("admin") === "1";

  if (isAdminQuery) {
    const authUser = await getAuthUser(req);
    if (!authUser || !["ADMIN", "EDITOR"].includes(authUser.role)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "25"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [reviews, total, pendingCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true, rating: true, content: true, authorName: true, status: true, createdAt: true,
          productId: true, postId: true,
          product: { select: { name: true, slug: true } },
          post: { select: { title: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({ reviews, total, pendingCount });
  }

  const productId = searchParams.get("productId");
  const postId = searchParams.get("postId");

  if (!productId && !postId) {
    return NextResponse.json({ error: "Specifica productId o postId" }, { status: 400 });
  }

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (productId) where.productId = productId;
  if (postId) where.postId = postId;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, rating: true, content: true, authorName: true, createdAt: true,
    },
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  // Strict rate limit: 5 reviews per 10 minutes per IP
  const limited = checkRateLimit(req, "reviews-create", { limit: 5, windowSec: 600 });
  if (limited) return limited;

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi", details: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, postId, rating, content, anonymous, authorName } = parsed.data;
  const ip = getIp(req);
  const ipHash = hashIp(ip);

  // Extra DB-level anti-spam: max 3 reviews per IP per entity in last 30 min
  const recentCount = await prisma.review.count({
    where: {
      ipHash,
      ...(productId ? { productId } : { postId }),
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
  });
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Hai già inviato troppi recensioni di recente. Riprova tra poco." },
      { status: 429 }
    );
  }

  // Get logged-in user if any
  const authUser = await getAuthUser(req);
  const userId = authUser ? (await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { id: true, name: true },
  })) : null;

  // Determine display name
  let displayName: string | null = null;
  if (!anonymous && !authUser) {
    displayName = authorName?.trim() || null;
  } else if (!anonymous && userId) {
    displayName = userId.name ?? null;
  }
  // anonymous = null displayName

  // Auto-approve logic: product reviews are approved immediately, blog post reviews need moderation
  const status = productId ? "APPROVED" : "PENDING";

  const review = await prisma.review.create({
    data: {
      productId: productId ?? null,
      postId: postId ?? null,
      userId: (!anonymous && userId) ? userId.id : null,
      authorName: displayName,
      rating,
      content: content.trim(),
      status,
      ipHash,
    },
    select: {
      id: true, rating: true, content: true, authorName: true, createdAt: true, status: true,
    },
  });

  const message = status === "APPROVED"
    ? "Recensione pubblicata con successo!"
    : "Recensione inviata! Sarà pubblicata dopo la moderazione.";

  return NextResponse.json({ review, message }, { status: 201 });
}
