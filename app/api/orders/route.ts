import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRoles, getAuthUser, apiError, apiValidationError } from "@/lib/middleware/rbac";
import { checkRateLimit, rateLimits } from "@/lib/middleware/rateLimit";
import { createOrderSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// ADMIN/EDITOR → all orders (paginated, status filter)
// READER → own orders only (requires auth)
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, "orders-list", rateLimits.api);
  if (limited) return limited;

  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const isEditor = user.role === "ADMIN" || user.role === "EDITOR";
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  type OrderStatus = (typeof validStatuses)[number];

  const where = {
    ...(isEditor ? {} : { userId: user.userId }),
    ...(status && validStatuses.includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: isEditor
        ? { user: { select: { id: true, email: true, name: true } } }
        : undefined,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, "orders-create", rateLimits.api);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch { return apiError("Corpo non valido", 400); }

  let input;
  try { input = createOrderSchema.parse(body); }
  catch (err) { if (err instanceof ZodError) return apiValidationError(err); return apiError("Dati non validi", 422); }

  // Validate products exist + are published, compute total
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "PUBLISHED" },
    select: { id: true, name: true, price: true, stock: true },
  });

  if (products.length !== productIds.length) {
    return apiError("Uno o più prodotti non sono disponibili", 422);
  }

  // Build order items with current prices (never trust client prices)
  const productMap = new Map(products.map((p) => [p.id, p]));
  const itemsWithPrice = input.items.map((item) => {
    const p = productMap.get(item.productId)!;
    return { productId: p.id, name: p.name, price: p.price.toNumber(), quantity: item.quantity };
  });

  const total = itemsWithPrice.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const user = await getAuthUser(req);

  const order = await prisma.order.create({
    data: {
      userId: user?.userId ?? null,
      total: new Decimal(total.toFixed(2)),
      items: itemsWithPrice,
      shipping: input.shipping,
      notes: input.notes,
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}
