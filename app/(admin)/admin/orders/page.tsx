"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { Column, StatusTab } from "@/components/admin/data-table/DataTable";

interface Order {
  id: string;
  status: string;
  total: number;
  user: { name?: string | null; email: string };
  items: { id: string }[];
  createdAt: string;
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa",
  CONFIRMED: "Confermato",
  PROCESSING: "In lavorazione",
  SHIPPED: "Spedito",
  DELIVERED: "Consegnato",
  CANCELLED: "Annullato",
  REFUNDED: "Rimborsato",
};

const LIMIT = 20;
const fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const columns: Column<Order>[] = [
    {
      key: "id",
      label: "Ordine",
      render: (o) => (
        <div>
          <a href={`/admin/orders/${o.id}`} className="font-medium text-[#2271b1] hover:underline">
            #{o.id.slice(-8).toUpperCase()}
          </a>
          <p className="text-xs text-gray-400 mt-0.5">{o.items.length} articoli</p>
        </div>
      ),
    },
    {
      key: "user",
      label: "Cliente",
      render: (o) => (
        <div>
          <p className="text-sm text-gray-800">{o.user.name ?? "—"}</p>
          <p className="text-xs text-gray-400">{o.user.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Stato",
      render: (o) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGES[o.status] ?? "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABELS[o.status] ?? o.status}
        </span>
      ),
    },
    {
      key: "total",
      label: "Totale",
      render: (o) => <span className="text-sm font-semibold text-gray-800">{fmt.format(o.total)}</span>,
    },
    {
      key: "createdAt",
      label: "Data",
      render: (o) => (
        <span className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString("it-IT")}</span>
      ),
    },
  ];

  const statusTabs: StatusTab[] = [
    { value: "all", label: "Tutti" },
    { value: "PENDING", label: "In attesa" },
    { value: "CONFIRMED", label: "Confermati" },
    { value: "PROCESSING", label: "In lavorazione" },
    { value: "SHIPPED", label: "Spediti" },
    { value: "DELIVERED", label: "Consegnati" },
    { value: "CANCELLED", label: "Annullati" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Ordini</h1>
      </div>
      <DataTable
        data={orders}
        columns={columns}
        loading={loading}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        statusTabs={statusTabs}
        activeStatus={activeStatus}
        onStatusChange={(s) => { setActiveStatus(s); setPage(1); }}
        rowActions={(o) => [
          { label: "Dettaglio", onClick: () => { window.location.href = `/admin/orders/${o.id}`; } },
        ]}
        emptyMessage="Nessun ordine trovato."
      />
    </div>
  );
}
