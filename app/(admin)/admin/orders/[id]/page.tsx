import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import OrderDetail from "@/components/admin/orders/OrderDetail";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Ordine #${id.slice(-8).toUpperCase()} — Admin` };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!order) notFound();

  // Serialize for client component (Decimal → number, Date → ISO string)
  const serialized = {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    user: order.user,
    notes: order.notes,
    shippingAddress: order.shipping as Record<string, string> | null,
    items: Array.isArray(order.items)
      ? (order.items as Array<{ productId?: string; name?: string; price?: number; quantity?: number }>).map((item) => ({
          id: item.productId ?? Math.random().toString(36).slice(2),
          quantity: item.quantity ?? 1,
          price: item.price ?? 0,
          product: {
            id: item.productId ?? "",
            name: item.name ?? "Prodotto",
            slug: "",
            images: [] as string[],
          },
        }))
      : [],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1.5 text-sm text-[#2271b1] hover:underline"
        >
          <ArrowLeft size={14} /> Ordini
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">
          Ordine #{order.id.slice(-8).toUpperCase()}
        </h1>
      </div>
      <OrderDetail order={serialized} />
    </div>
  );
}
