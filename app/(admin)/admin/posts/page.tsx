"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DataTable, { Column, BulkAction, StatusTab } from "@/components/admin/data-table/DataTable";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  author: { name?: string | null; email: string };
  createdAt: string;
  updatedAt: string;
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

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleBulkAction(action: string, ids: string[]) {
    await fetch("/api/posts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    fetchPosts();
  }

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function doDelete(id: string) {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    fetchPosts();
  }

  const columns: Column<Post>[] = [
    {
      key: "title",
      label: "Titolo",
      render: (post) => (
        <div>
          <a href={`/admin/posts/${post.id}/edit`} className="font-medium text-[#2271b1] hover:underline">
            {post.title}
          </a>
          <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[post.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[post.status] ?? post.status}
            </span>
            <span>/{post.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: "author",
      label: "Autore",
      render: (post) => <span className="text-sm text-gray-600">{post.author.name ?? post.author.email}</span>,
    },
    {
      key: "createdAt",
      label: "Data",
      render: (post) => (
        <span className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString("it-IT")}</span>
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
        <h1 className="text-xl font-semibold text-gray-800">Post</h1>
        <Link
          href="/admin/posts/new"
          className="px-3 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] transition-colors"
        >
          + Aggiungi
        </Link>
      </div>
      <DataTable
        data={posts}
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
        rowActions={(post) => [
          { label: "Modifica", onClick: () => { window.location.href = `/admin/posts/${post.id}/edit`; } },
          { label: "Visualizza", onClick: () => window.open(`/it/blog/${post.slug}`, "_blank") },
          { label: "Elimina", onClick: () => handleDelete(post.id), destructive: true },
        ]}
        emptyMessage="Nessun post trovato."
      />
      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questo post? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
