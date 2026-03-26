"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import PublishBox from "@/components/admin/editor/PublishBox";
import SlugEditor, { titleToSlug } from "@/components/admin/editor/SlugEditor";
import SeoBox from "@/components/admin/editor/SeoBox";
import { Maximize2, Minimize2 } from "lucide-react";

interface CodePageEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    slug?: string;
    content?: string; // JSON: {html, css, js, fullscreen}
    status?: "DRAFT" | "PUBLISHED";
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: string | null;
  };
  pageId?: string;
}

type Tab = "html" | "css" | "js";

export default function CodePageEditor({ initialData, pageId }: CodePageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("html");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initialData?.status ?? "DRAFT");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? "");
  const [publishedAt] = useState<string | null>(initialData?.publishedAt ?? null);
  const [fullscreen, setFullscreen] = useState(false);

  // Parse stored JSON content
  const parsed = (() => {
    try { return JSON.parse(initialData?.content ?? "{}"); } catch { return {}; }
  })();
  const [htmlCode, setHtmlCode] = useState<string>(parsed.html ?? "");
  const [cssCode, setCssCode] = useState<string>(parsed.css ?? "");
  const [jsCode, setJsCode] = useState<string>(parsed.js ?? "");

  useEffect(() => {
    if (!pageId && title && !slug) {
      setSlug(titleToSlug(title));
    }
  }, [title, pageId, slug]);

  const handleSave = useCallback(async (newStatus: "DRAFT" | "PUBLISHED") => {
    setSaving(true);
    setError(null);

    if (!title.trim()) {
      setError("Il titolo è obbligatorio");
      setSaving(false);
      return;
    }
    const effectiveSlug = slug.trim() || titleToSlug(title.trim());
    if (effectiveSlug !== slug) setSlug(effectiveSlug);

    const content = JSON.stringify({ html: htmlCode, css: cssCode, js: jsCode, fullscreen });

    const body = {
      title: title.trim(),
      slug: effectiveSlug,
      content,
      type: "CODE",
      status: newStatus,
      seoTitle,
      seoDescription,
    };

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
  }, [title, slug, htmlCode, cssCode, jsCode, fullscreen, seoTitle, seoDescription, pageId, router]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "html", label: "HTML" },
    { key: "css", label: "CSS" },
    { key: "js", label: "JavaScript" },
  ];

  const extensions = activeTab === "html" ? [html()] : activeTab === "css" ? [css()] : [javascript()];
  const value = activeTab === "html" ? htmlCode : activeTab === "css" ? cssCode : jsCode;
  const onChange = activeTab === "html" ? setHtmlCode : activeTab === "css" ? setCssCode : setJsCode;

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
        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#1e1e24] border border-gray-700 rounded shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between border-b border-gray-700 bg-[#16161a] px-2">
              <div className="flex">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                      activeTab === tab.key
                        ? "text-white border-b-2 border-[#2271b1]"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 pr-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fullscreen}
                    onChange={(e) => setFullscreen(e.target.checked)}
                    className="accent-[#2271b1]"
                  />
                  Schermo intero
                </label>
                <button
                  type="button"
                  onClick={() => setFullscreen((f) => !f)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={fullscreen ? "Disattiva schermo intero" : "Attiva schermo intero"}
                >
                  {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>
            {/* CodeMirror */}
            <CodeMirror
              value={value}
              onChange={onChange}
              extensions={extensions}
              theme={oneDark}
              height="480px"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-3">
          <PublishBox
            status={status}
            publishedAt={publishedAt}
            onSaveDraft={() => handleSave("DRAFT")}
            onPublish={() => handleSave("PUBLISHED")}
            loading={saving}
            isNew={!pageId}
          />
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
