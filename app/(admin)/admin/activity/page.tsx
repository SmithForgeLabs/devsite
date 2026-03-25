"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  FilePlus2,
  PencilLine,
  Trash2,
  Rocket,
  EyeOff,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  meta?: { changes?: string[] } | null;
  createdAt: string;
  user: { id: string; email: string; name?: string | null } | null;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  CREATE: <FilePlus2 size={14} className="text-emerald-600" />,
  UPDATE: <PencilLine size={14} className="text-blue-500" />,
  DELETE: <Trash2 size={14} className="text-red-500" />,
  PUBLISH: <Rocket size={14} className="text-violet-500" />,
  UNPUBLISH: <EyeOff size={14} className="text-gray-400" />,
  LOGIN: <LogIn size={14} className="text-amber-500" />,
};

const ACTION_DOT: Record<string, string> = {
  CREATE: "bg-emerald-400",
  UPDATE: "bg-blue-400",
  DELETE: "bg-red-400",
  PUBLISH: "bg-violet-400",
  UNPUBLISH: "bg-gray-300",
  LOGIN: "bg-amber-400",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: "ha creato",
  UPDATE: "ha modificato",
  DELETE: "ha eliminato",
  PUBLISH: "ha pubblicato",
  UNPUBLISH: "ha rimosso dalla pubblicazione",
  LOGIN: "ha effettuato l'accesso",
};

const ENTITY_TABS = [
  { key: "all", label: "Tutti" },
  { key: "post", label: "Post" },
  { key: "page", label: "Pagine" },
  { key: "product", label: "Prodotti" },
  { key: "order", label: "Ordini" },
  { key: "login", label: "Accessi" },
];

const LIMIT = 25;

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "adesso";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorni fa`;
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function AdminActivityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("entityType") ?? "all";
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(currentPage) });
      if (activeTab !== "all") params.set("entityType", activeTab);
      const res = await fetch(`/api/admin/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.logs ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function navigate(tab: string, page: number) {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("entityType", tab);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ""));
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Registro attività</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cronologia completa delle azioni eseguite nel sito.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key, 1)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Caricamento…</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Nessuna attività trovata.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {entries.map((entry) => {
              const actor = entry.user?.name ?? entry.user?.email ?? "Utente";
              const verb = ACTION_LABEL[entry.action] ?? entry.action;
              const changes = (entry.meta as { changes?: string[] } | null)?.changes ?? [];
              return (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                  {/* dot */}
                  <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${ACTION_DOT[entry.action] ?? "bg-gray-300"}`} />
                  {/* icon */}
                  <span className="flex-shrink-0 mt-0.5">{ACTION_ICON[entry.action]}</span>
                  {/* text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{actor}</span>{" "}
                      {verb}
                      {entry.entityName ? (
                        <> <span className="font-medium text-gray-800">&ldquo;{entry.entityName}&rdquo;</span></>
                      ) : null}
                    </p>
                    {changes.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {changes.map((c, i) => (
                          <li key={i} className="text-xs text-gray-400 before:content-['·'] before:mr-1">{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* time */}
                  <span className="flex-shrink-0 text-xs text-gray-400 mt-0.5 whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {total} {total === 1 ? "evento" : "eventi"} · pagina {currentPage} di {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => navigate(activeTab, currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} /> Precedente
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => navigate(activeTab, currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Successiva <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
