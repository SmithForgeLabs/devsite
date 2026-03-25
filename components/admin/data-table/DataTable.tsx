"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface StatusTab {
  value: string;
  label: string;
  count?: number;
}

export interface BulkAction {
  value: string;
  label: string;
  destructive?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  total: number;
  page: number;
  limit: number;
  loading?: boolean;
  statusTabs?: StatusTab[];
  activeStatus?: string;
  onStatusChange?: (status: string) => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (key: string, dir: "asc" | "desc") => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSearch?: (q: string) => void;
  searchValue?: string;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, ids: string[]) => void;
  rowActions?: (row: T) => Array<{ label: string; onClick: () => void; destructive?: boolean }>;
  onQuickEdit?: (row: T) => void;
  emptyMessage?: string;
}

const LIMIT_OPTIONS = [10, 20, 50, 100];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  total,
  page,
  limit,
  loading,
  statusTabs,
  activeStatus = "all",
  onStatusChange,
  onPageChange,
  onLimitChange,
  onSort,
  sortKey,
  sortDir,
  onSearch,
  searchValue = "",
  bulkActions,
  onBulkAction,
  rowActions,
  onQuickEdit,
  emptyMessage = "Nessun elemento trovato.",
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState("");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const allSelected = data.length > 0 && data.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(data.map((r) => r.id)));
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onSearch) return;
      if (searchRef.current) clearTimeout(searchRef.current);
      searchRef.current = setTimeout(() => onSearch(e.target.value), 300);
    },
    [onSearch]
  );

  const handleSort = (key: string) => {
    if (!onSort) return;
    if (sortKey === key) {
      onSort(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  };

  const handleBulkApply = () => {
    if (!bulkValue || selected.size === 0 || !onBulkAction) return;
    onBulkAction(bulkValue, Array.from(selected));
    setBulkValue("");
    setSelected(new Set());
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        {/* Status tabs */}
        {statusTabs && statusTabs.length > 0 && (
          <div className="flex flex-wrap gap-0 px-4 pt-3 border-b border-gray-100">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onStatusChange?.(tab.value)}
                className={`px-3 py-1.5 text-sm transition-colors border-b-2 ${
                  activeStatus === tab.value
                    ? "border-[#2271b1] text-[#2271b1] font-medium"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 text-xs text-gray-400">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 p-3">
          {/* Bulk actions */}
          {bulkActions && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              >
                <option value="">Azioni di massa</option>
                {bulkActions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkApply}
                disabled={!bulkValue || selected.size === 0}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Applica
              </button>
              {selected.size > 0 && (
                <span className="text-xs text-gray-500">
                  {selected.size} selezionati
                </span>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Search */}
          {onSearch && (
            <input
              type="search"
              placeholder="Cerca..."
              defaultValue={searchValue}
              onChange={handleSearch}
              className="text-sm border border-gray-300 rounded px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
            />
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {bulkActions && (
                <th className="w-8 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-left font-medium text-gray-700 whitespace-nowrap ${col.className ?? ""} ${col.sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (bulkActions ? 1 : 0)} className="py-12 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (bulkActions ? 1 : 0)} className="py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const actions = rowActions?.(row) ?? [];
                return (
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    {bulkActions && (
                      <td className="px-3 py-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    {columns.map((col, i) => (
                      <td key={col.key} className={`px-3 py-2.5 ${col.className ?? ""}`}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}

                        {/* Row hover actions — first column only */}
                        {i === 0 && hoveredRow === row.id && (actions.length > 0 || onQuickEdit) && (
                          <div className="flex items-center gap-2 mt-1">
                            {actions.map((action, ai) => (
                              <button
                                key={ai}
                                onClick={action.onClick}
                                className={`text-xs ${action.destructive ? "text-red-600 hover:text-red-800" : "text-[#2271b1] hover:text-[#135e96]"} transition-colors`}
                              >
                                {action.label}
                              </button>
                            ))}
                            {onQuickEdit && (
                              <button
                                onClick={() => onQuickEdit(row)}
                                className="text-xs text-[#2271b1] hover:text-[#135e96] transition-colors"
                              >
                                Modifica rapida
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Righe:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-sm focus:outline-none"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <span>
          {total === 0 ? "0 elementi" : `${from}–${to} di ${total}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
            return (
              <button
                key={p}
                onClick={() => onPageChange?.(p)}
                className={`w-8 h-8 text-sm rounded transition-colors ${
                  p === page ? "bg-[#2271b1] text-white" : "hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
