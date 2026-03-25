"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { Column, BulkAction, StatusTab } from "@/components/admin/data-table/DataTable";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface Page {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-800",
  DRAFT: "bg-yellow-100 text-yellow-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Pubblicata",
  DRAFT: "Bozza",
  ARCHIVED: "Archiviata",
};

const LIMIT = 20;

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  async function handleBulkAction(action: string, ids: string[]) {
    await fetch("/api/pages/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    fetchPages();
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function doDelete(id: string) {
    await fetch(`/api/pages/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    fetchPages();
  }

  const columns: Column<Page>[] = [
    {
      key: "title",
      label: "Titolo",
      render: (p) => (
        <div>
          <a href={`/admin/pages/${p.id}/edit`} className="font-medium text-[#2271b1] hover:underline">
            {p.title}
          </a>
          <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
            <span>/{p.slug}</span>
          </div>
        </div>
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
    { value: "all", label: "Tutte" },
    { value: "PUBLISHED", label: "Pubblicate" },
    { value: "DRAFT", label: "Bozze" },
    { value: "ARCHIVED", label: "Archiviate" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Pagine</h1>
        <a href="/admin/pages/new" className="px-3 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] transition-colors">
          + Aggiungi
        </a>
      </div>
      <DataTable
        data={pages}
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
          { label: "Modifica", onClick: () => { window.location.href = `/admin/pages/${p.id}/edit`; } },
          { label: "Visualizza", onClick: () => window.open(`/${p.slug}`, "_blank") },
          { label: "Elimina", onClick: () => handleDelete(p.id), destructive: true },
        ]}
        emptyMessage="Nessuna pagina trovata."
      />
      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questa pagina? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
