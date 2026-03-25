"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ShoppingCart, Users, Package } from "lucide-react";

interface Stats {
  posts: number;
  pages: number;
  products: number;
  orders: number;
  users: number;
  revenue: number;
  pendingOrders: number;
  mediaFiles: number;
}

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  border: string;
  href: string;
}

export default function StatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards: StatCard[] = [
    {
      label: "Post pubblicati",
      value: stats?.posts ?? "—",
      icon: <FileText size={20} />,
      color: "bg-blue-50 text-blue-600",
      border: "border-l-blue-500",
      href: "/admin/posts",
    },
    {
      label: "Prodotti",
      value: stats?.products ?? "—",
      icon: <Package size={20} />,
      color: "bg-emerald-50 text-emerald-600",
      border: "border-l-emerald-500",
      href: "/admin/products",
    },
    {
      label: "Ordini in attesa",
      value: stats?.pendingOrders ?? "—",
      icon: <ShoppingCart size={20} />,
      color: "bg-amber-50 text-amber-600",
      border: "border-l-amber-500",
      href: "/admin/orders",
    },
    {
      label: "Utenti",
      value: stats?.users ?? "—",
      icon: <Users size={20} />,
      color: "bg-violet-50 text-violet-600",
      border: "border-l-violet-500",
      href: "/admin/users",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <a
          key={card.label}
          href={card.href}
          className={`group bg-white rounded-xl p-5 flex items-start justify-between border border-gray-100 border-l-4 ${card.border} hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-200 active:scale-[0.99] cursor-pointer`}
        >
          <div>
            <p className="text-3xl font-black tabular-nums tracking-tight text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">{card.label}</p>
          </div>
          <div className={`${card.color} flex-shrink-0 p-2.5 rounded-xl`}>
            {card.icon}
          </div>
        </a>
      ))}

      {/* Revenue full-width card */}
      {stats && (
        <Link
          href="/admin/orders"
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 col-span-2 lg:col-span-4 hover:shadow-md transition-shadow"
        >
          <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
                stats.revenue
              )}
            </p>
            <p className="text-xs text-gray-500">Fatturato totale</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-gray-700">{stats.orders} ordini totali</p>
            <p className="text-xs text-gray-400">{stats.pages} pagine · {stats.mediaFiles} file media</p>
          </div>
        </Link>
      )}
    </div>
  );
}
