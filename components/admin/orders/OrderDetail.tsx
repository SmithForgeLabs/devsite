"use client";

import { useState } from "react";
import OrderTimeline from "./OrderTimeline";
import { ChevronDown, ExternalLink } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
  items: OrderItem[];
  shippingAddress?: Record<string, string> | null;
  notes?: string | null;
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "In attesa" },
  { value: "CONFIRMED", label: "Confermato" },
  { value: "PROCESSING", label: "In lavorazione" },
  { value: "SHIPPED", label: "Spedito" },
  { value: "DELIVERED", label: "Consegnato" },
  { value: "CANCELLED", label: "Annullato" },
  { value: "REFUNDED", label: "Rimborsato" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

interface OrderDetailProps {
  order: Order;
  onStatusChange?: (newStatus: string) => void;
}

export default function OrderDetail({ order, onStatusChange }: OrderDetailProps) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  async function changeStatus(newStatus: string) {
    if (newStatus === status) { setShowStatusMenu(false); return; }
    setSaving(true);
    setShowStatusMenu(false);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } finally {
      setSaving(false);
    }
  }

  const fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-4">
        {/* Order items */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">
            Articoli ordine
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <a
                    href={`/admin/products/${item.product.id}/edit`}
                    className="text-sm font-medium text-[#2271b1] hover:underline truncate block"
                  >
                    {item.product.name}
                  </a>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-800">{fmt.format(item.price)}</p>
                  <p className="text-xs text-gray-400">cad.</p>
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Totale ordine</span>
            <span className="text-lg font-bold text-gray-900">{fmt.format(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Note cliente</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Stato ordine</h3>
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              disabled={saving}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm font-medium ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-800"} border-transparent`}
            >
              <span>
                {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
              </span>
              <ChevronDown size={14} />
            </button>
            {showStatusMenu && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-md overflow-hidden">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => changeStatus(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${opt.value === status ? "font-semibold text-[#2271b1]" : "text-gray-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <OrderTimeline
          status={status}
          createdAt={order.createdAt}
          updatedAt={order.updatedAt}
        />

        {/* Customer */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cliente</h3>
          {order.user ? (
            <>
              <p className="text-sm font-medium text-gray-800">
                {order.user.name ?? "—"}
              </p>
              <a
                href={`mailto:${order.user.email}`}
                className="text-sm text-[#2271b1] hover:underline"
              >
                {order.user.email}
              </a>
              <a
                href={`/admin/users/${order.user.id}/edit`}
                className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#2271b1]"
              >
                <ExternalLink size={11} /> Vedi profilo
              </a>
            </>
          ) : (
            <p className="text-sm text-gray-500">Ospite (checkout senza account)</p>
          )}
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Indirizzo di spedizione</h3>
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              {Object.values(order.shippingAddress)
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </address>
          </div>
        )}
      </div>
    </div>
  );
}
