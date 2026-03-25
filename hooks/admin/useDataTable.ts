"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface UseDataTableOptions {
  defaultLimit?: number;
  defaultSort?: string;
  defaultSortDir?: "asc" | "desc";
}

export interface DataTableState {
  page: number;
  limit: number;
  search: string;
  status: string;
  sortKey: string;
  sortDir: "asc" | "desc";
}

export function useDataTable({
  defaultLimit = 20,
  defaultSort = "createdAt",
  defaultSortDir = "desc",
}: UseDataTableOptions = {}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  const reset = useCallback(() => {
    setPage(1);
    setSearch("");
    setStatus("all");
    setSortKey(defaultSort);
    setSortDir(defaultSortDir);
  }, [defaultSort, defaultSortDir]);

  const handleSort = useCallback((key: string, dir: "asc" | "desc") => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((s: string) => {
    setStatus(s);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((l: number) => {
    setLimit(l);
    setPage(1);
  }, []);

  // Build query params for API calls
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(status && status !== "all" ? { status } : {}),
    ...(sortKey ? { sort: sortKey, sortDir } : {}),
  });

  return {
    state: { page, limit, search, status, sortKey, sortDir },
    queryParams,
    handlers: {
      setPage,
      setLimit: handleLimitChange,
      setSearch: handleSearch,
      setStatus: handleStatusChange,
      setSort: handleSort,
    },
    reset,
  };
}
