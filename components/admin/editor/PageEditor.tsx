"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PublishBox from "@/components/admin/editor/PublishBox";
import SlugEditor, { titleToSlug } from "@/components/admin/editor/SlugEditor";
import SeoBox from "@/components/admin/editor/SeoBox";

interface PageEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    slug?: string;
    content?: string;
    type?: "LANDING" | "PORTFOLIO" | "BLOG" | "SHOP" | "HOME" | "CUSTOM" | "CODE";
    status?: "DRAFT" | "PUBLISHED";
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: string | null;
  };
  pageId?: string;
}

const AUTO_CONTENT_TYPES = ["BLOG", "SHOP", "PORTFOLIO"] as const;
const AUTO_CONTENT_LABELS: Record<string, string> = {
  BLOG: "Blog",
  SHOP: "Negozio",
  PORTFOLIO: "Portfolio",
};

export default function PageEditor({ initialData, pageId }: PageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const type = initialData?.type ?? "LANDING";
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initialData?.status ?? "DRAFT");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? "");
  const [publishedAt] = useState<string | null>(initialData?.publishedAt ?? null);

  useEffect(() => {
    if (!pageId && title && !slug) {
      setSlug(titleToSlug(title));
    }
  }, [title, pageId, slug]);

  async function handleSave(newStatus: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setError(null);

    if (!title.trim()) {
      setError("Il titolo è obbligatorio");
      setSaving(false);
      return;
    }
    const effectiveSlug = slug.trim() || titleToSlug(title.trim());
    if (effectiveSlug !== slug) setSlug(effectiveSlug);

    const body = { title: title.trim(), slug: effectiveSlug, content, type, status: newStatus, seoTitle, seoDescription };

    try {
      const res = pageId
        ? await fetch(`/api/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore" }));
        setError(err.error ?? "Errore nel salvataggio");
        return;
      }

      const data = await res.json();
      if (!pageId) {
        router.push(`/admin/pages/${data.page.id}/edit`);
      } else {
        setStatus(newStatus);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo pagina"
          className="w-full text-2xl font-semibold border-none border-b border-gray-200 pb-2 focus:outline-none focus:border-[#2271b1] bg-transparent"
        />
      </div>

      <div className="mb-4">
        <SlugEditor slug={slug} onChange={setSlug} baseUrl="" />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
              Contenuto
            </div>
            <div className="p-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={24}
                placeholder="Contenuto della pagina..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-64 flex-shrink-0 space-y-3">
          <PublishBox
            status={status}
            publishedAt={publishedAt}
            onSaveDraft={() => handleSave("DRAFT")}
            onPublish={() => handleSave("PUBLISHED")}
            loading={saving}
            isNew={!pageId}
          />
          {(AUTO_CONTENT_TYPES as readonly string[]).includes(type) && (
            <div className="bg-blue-50 border border-blue-200 rounded shadow-sm p-3 text-xs text-blue-700 leading-relaxed">
              <strong>Contenuto automatico.</strong> Il contenuto di tipo{" "}
              <strong>{AUTO_CONTENT_LABELS[type]}</strong> viene generato automaticamente
              dal sistema. Titolo e SEO vengono usati per la pagina.
            </div>
          )}
          <SeoBox
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            onTitleChange={setSeoTitle}
            onDescriptionChange={setSeoDescription}
            fallbackTitle={title}
          />
        </div>
      </div>
    </div>
  );
}
