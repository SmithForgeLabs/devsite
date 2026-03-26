"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/admin/data-table/DataTable";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  EDITOR: "bg-blue-100 text-blue-800",
  READER: "bg-gray-100 text-gray-700",
};

const LIMIT = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleDelete(id: string) {
    setPendingDelete(id);
  }

  async function doDelete(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setPendingDelete(null);
    fetchUsers();
  }

  const columns: Column<User>[] = [
    {
      key: "email",
      label: "Utente",
      render: (u) => (
        <div>
          <a href={`/admin/users/${u.id}/edit`} className="font-medium text-[#2271b1] hover:underline">
            {u.name ?? u.email}
          </a>
          {u.name && <p className="text-xs text-gray-400">{u.email}</p>}
        </div>
      ),
    },
    {
      key: "role",
      label: "Ruolo",
      render: (u) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"}`}>
          {u.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Registrato il",
      className: "hidden sm:table-cell",
      render: (u) => (
        <span className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("it-IT")}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Utenti</h1>
        <Link href="/admin/users/new" className="px-3 py-1.5 bg-[#2271b1] text-white text-sm rounded hover:bg-[#1761a8] transition-colors">
          + Aggiungi
        </Link>
      </div>
      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        rowActions={(u) => [
          { label: "Modifica", onClick: () => { window.location.href = `/admin/users/${u.id}/edit`; } },
          { label: "Elimina", onClick: () => handleDelete(u.id), destructive: true },
        ]}
        emptyMessage="Nessun utente trovato."
      />
      {pendingDelete && (
        <ConfirmDialog
          message="Eliminare questo utente? L'operazione è irreversibile."
          onConfirm={() => doDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
