"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  authorName: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  productId: string | null;
  postId: string | null;
  product?: { name: string; slug: string } | null;
  post?: { title: string; slug: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "In attesa",
  APPROVED: "Approvata",
  REJECTED: "Rifiutata",
};

const LIMIT = 25;

function StarBadge({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= rating ? "text-amber-400" : "text-gray-200"}
          fill={s <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [pendingCount, setPendingCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        admin: "1",
      });
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setTotal(data.total ?? 0);
        if (data.pendingCount !== undefined) setPendingCount(data.pendingCount);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleAction(id: string, action: "approve" | "reject") {
    const status = action === "approve" ? "APPROVED" : "REJECTED";
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchReviews();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa recensione?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    fetchReviews();
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Recensioni
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestisci le recensioni di prodotti e articoli del blog.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Aggiorna
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0.5 border-b border-[#e2e4e7]">
        {[
          { value: "PENDING", label: "In attesa" },
          { value: "APPROVED", label: "Approvate" },
          { value: "REJECTED", label: "Rifiutate" },
          { value: "all", label: "Tutte" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilterStatus(tab.value); setPage(1); }}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 ${
              filterStatus === tab.value
                ? "border-[#2271b1] text-[#2271b1] font-medium"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
            {tab.value === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#e2e4e7] bg-white overflow-hidden">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#2271b1]" />
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">Nessuna recensione trovata.</p>
        )}

        {!loading && reviews.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e4e7] bg-[#f6f7f7] text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Autore / Contenuto</th>
                <th className="px-4 py-3 text-left font-medium">Entità</th>
                <th className="px-4 py-3 text-left font-medium">Voto</th>
                <th className="px-4 py-3 text-left font-medium">Stato</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-right font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className={`border-b border-[#e2e4e7] last:border-0 hover:bg-[#f6f7f7] transition-colors ${
                    review.status === "PENDING" ? "bg-amber-50/50" : ""
                  }`}
                >
                  {/* Author / Content */}
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-800 truncate">
                      {review.authorName ?? <span className="italic text-gray-400">Anonimo</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {review.content}
                    </p>
                  </td>

                  {/* Entity link */}
                  <td className="px-4 py-3">
                    {review.product ? (
                      <div>
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 mb-1">
                          Prodotto
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/shop/${review.product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2271b1] hover:underline truncate max-w-[120px]"
                          >
                            {review.product.name}
                          </a>
                          <ExternalLink size={10} className="text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    ) : review.post ? (
                      <div>
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 mb-1">
                          Blog
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/blog/${review.post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2271b1] hover:underline truncate max-w-[120px]"
                          >
                            {review.post.title}
                          </a>
                          <ExternalLink size={10} className="text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarBadge rating={review.rating} />
                    <span className="text-[10px] text-gray-400 mt-0.5">{review.rating}/5</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[review.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[review.status] ?? review.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("it-IT", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {review.status !== "APPROVED" && (
                        <button
                          onClick={() => handleAction(review.id, "approve")}
                          title="Approva"
                          className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {review.status !== "REJECTED" && (
                        <button
                          onClick={() => handleAction(review.id, "reject")}
                          title="Rifiuta"
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        title="Elimina"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-xs px-2"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} risultati totali</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-[#e2e4e7] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="px-3 py-1.5 text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-[#e2e4e7] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
