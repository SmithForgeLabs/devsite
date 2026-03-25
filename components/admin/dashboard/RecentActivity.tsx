"use client";

import { useEffect, useState } from "react";
import {
  FilePlus2,
  PencilLine,
  Trash2,
  Rocket,
  EyeOff,
  LogIn,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <FilePlus2 size={13} className="text-emerald-600" />,
  UPDATE: <PencilLine size={13} className="text-blue-500" />,
  DELETE: <Trash2 size={13} className="text-red-500" />,
  PUBLISH: <Rocket size={13} className="text-violet-500" />,
  UNPUBLISH: <EyeOff size={13} className="text-gray-400" />,
  LOGIN: <LogIn size={13} className="text-amber-500" />,
};

const ACTION_DOT_COLOR: Record<string, string> = {
  CREATE: "bg-emerald-400",
  UPDATE: "bg-blue-400",
  DELETE: "bg-red-400",
  PUBLISH: "bg-violet-400",
  UNPUBLISH: "bg-gray-400",
  LOGIN: "bg-amber-400",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "ha creato",
  UPDATE: "ha modificato",
  DELETE: "ha eliminato",
  PUBLISH: "ha pubblicato",
  UNPUBLISH: "ha rimosso dalla pubblicazione",
  LOGIN: "ha effettuato l'accesso",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "adesso";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  return `${Math.floor(hours / 24)} giorni fa`;
}

export default function RecentActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity?limit=20")
      .then((r) => r.json())
      .then((d) => setEntries(d.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-800">Attività recente</h3>
        <a href="/admin/activity" className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors">
          Vedi tutto
        </a>
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="h-3 flex-1 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-5 text-sm text-gray-400">Nessuna attività recente</p>
      ) : (
        <ul className="divide-y divide-gray-50 px-5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 py-3">
              {/* Timeline dot */}
              <div className="mt-1.5 flex-shrink-0 flex flex-col items-center">
                <span className={`h-2 w-2 rounded-full ${ACTION_DOT_COLOR[entry.action] ?? "bg-gray-300"}`} />
              </div>
              {/* Icon */}
              <span className="mt-0.5 flex-shrink-0">
                {ACTION_ICONS[entry.action] ?? <PencilLine size={13} className="text-gray-400" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">
                    {entry.user?.name ?? entry.user?.email ?? "Utente"}
                  </span>{" "}
                  {ACTION_LABELS[entry.action] ?? entry.action.toLowerCase()}{" "}
                  {entry.entityName ? (
                    <span className="font-medium text-gray-800">&ldquo;{entry.entityName}&rdquo;</span>
                  ) : (
                    <span className="text-gray-500">{entry.entityType.toLowerCase()}</span>
                  )}
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                {timeAgo(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
