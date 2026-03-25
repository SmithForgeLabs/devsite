"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { Column, BulkAction, StatusTab } from "@/components/admin/data-table/DataTable";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Pubblicato",
  DRAFT: "Bozza",
  ARCHIVED: "Archiviato",
};

const LIMIT = 20;
const fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function handleBulkAction(action: string, ids: string[]) {
    await fetch("/api/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    fetchProducts();
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function doDelete(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    fetchProducts();
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Prodotto",
      render: (p) => (
        <div>
          <a href={`/admin/products/${p.id}/edit`} className="font-medium text-[#2271b1] hover:underline">
            {p.name}
          </a>
          <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
            {p.category && (
              <span>{p.category.name}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Prezzo",
      render: (p) => <span className="text-sm font-medium text-gray-800">{fmt.format(p.price)}</span>,
    },
    {
      key: "stock",
      label: "Stock",
      render: (p) => (
        <span className={`text-sm font-medium ${p.stock <= 0 ? "text-red-600" : p.stock < 5 ? "text-yellow-600" : "text-gray-800"}`}>
          {p.stock}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Data",
      render: (p) => (
        <span className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString("it-IT")}</span>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    { label: "Pubblica", value: "publish" },
    { label: "Bozza", value: "draft" },
    { label: "Archivia", value: "archive" },
    { label: "Elimina", value: "delete", destructive: true },
  ];

  const statusTabs: StatusTab[] = [
    { value: "all", label: "Tutti" },
    { value: "PUBLISHED", label: "Pubblicati" },
    { value: "DRAFT", label: "Bozze" },
    { value: "ARCHIVED", label: "Archiviati" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Prodotti</h1>
        <div className="flex gap-2">
          <a href="/admin/products/categories" className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Categorie
          </a>
          <a href="/admin/products/new" className="px-3 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] transition-colors">
            + Aggiungi
          </a>
        </div>
      </div>
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        statusTabs={statusTabs}
        activeStatus={activeStatus}
        onStatusChange={(s) => { setActiveStatus(s); setPage(1); }}
        rowActions={(p) => [
          { label: "Modifica", onClick: () => { window.location.href = `/admin/products/${p.id}/edit`; } },
          { label: "Visualizza", onClick: () => window.open(`/shop/${p.slug}`, "_blank") },
          { label: "Elimina", onClick: () => handleDelete(p.id), destructive: true },
        ]}
        emptyMessage="Nessun prodotto trovato."
      />
      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questo prodotto? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
