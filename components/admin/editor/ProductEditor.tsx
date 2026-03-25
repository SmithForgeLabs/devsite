"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PublishBox from "@/components/admin/editor/PublishBox";
import SlugEditor, { titleToSlug } from "@/components/admin/editor/SlugEditor";
import FeaturedImage from "@/components/admin/editor/FeaturedImage";
import SeoBox from "@/components/admin/editor/SeoBox";
import CategoryPicker from "@/components/admin/editor/CategoryPicker";

interface ProductEditorProps {
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    comparePrice?: number | null;
    stock?: number;
    sku?: string | null;
    status?: "DRAFT" | "PUBLISHED";
    images?: string[];
    featuredImageKey?: string | null;
    seoTitle?: string;
    seoDescription?: string;
    categoryIds?: string[];
    publishedAt?: string | null;
  };
  productId?: string;
}

export default function ProductEditor({ initialData, productId }: ProductEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "inventory" | "images">("general");

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(String(initialData?.price ?? ""));
  const [comparePrice, setComparePrice] = useState(String(initialData?.comparePrice ?? ""));
  const [stock, setStock] = useState(String(initialData?.stock ?? "0"));
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initialData?.status ?? "DRAFT");
  const [featuredImage, setFeaturedImage] = useState<string | null>(
    initialData?.images?.[0] ?? null
  );
  const [featuredImageKey, setFeaturedImageKey] = useState<string | null>(
    initialData?.featuredImageKey ?? null
  );
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.categoryIds ?? []);
  const [publishedAt] = useState<string | null>(initialData?.publishedAt ?? null);

  useEffect(() => {
    if (!productId && name && !slug) {
      setSlug(titleToSlug(name));
    }
  }, [name, productId, slug]);

  async function handleSave(newStatus: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError("Il nome del prodotto è obbligatorio");
      setSaving(false);
      return;
    }
    const effectiveSlug = slug.trim() || titleToSlug(name.trim());
    if (effectiveSlug !== slug) setSlug(effectiveSlug);

    const body = {
      name: name.trim(),
      slug: effectiveSlug,
      description,
      price: parseFloat(price) || 0,
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      stock: parseInt(stock, 10) || 0,
      sku: sku || null,
      status: newStatus,
      images: featuredImage ? [featuredImage] : [],
      seoTitle,
      seoDescription,
      categoryId: categoryIds[0] ?? null,
    };

    try {
      const res = productId
        ? await fetch(`/api/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/products", {
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
      if (!productId) {
        router.push(`/admin/products/${data.product.id}/edit`);
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome prodotto"
          className="w-full text-2xl font-semibold border-none border-b border-gray-200 pb-2 focus:outline-none focus:border-[#2271b1] bg-transparent"
        />
      </div>
      <div className="mb-4">
        <SlugEditor slug={slug} onChange={setSlug} baseUrl="/shop" />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-5">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(["general", "inventory", "images"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  activeTab === t
                    ? "border-b-2 border-[#2271b1] text-[#2271b1]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "general" ? "Generale" : t === "inventory" ? "Inventario" : "Immagini"}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  placeholder="Descrizione del prodotto..."
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo barrato (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="Prezzo originale"
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Codice prodotto"
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantità in stock</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "images" && (
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <FeaturedImage
                imageUrl={featuredImage}
                storageKey={featuredImageKey}
                onSelect={(key, url) => { setFeaturedImageKey(key); setFeaturedImage(url); }}
                onRemove={() => { setFeaturedImageKey(null); setFeaturedImage(null); }}
              />
            </div>
          )}
        </div>

        <div className="w-64 flex-shrink-0 space-y-3">
          <PublishBox
            status={status}
            publishedAt={publishedAt}
            onSaveDraft={() => handleSave("DRAFT")}
            onPublish={() => handleSave("PUBLISHED")}
            loading={saving}
            isNew={!productId}
          />
          <CategoryPicker selected={categoryIds} onChange={setCategoryIds} />
          <SeoBox
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            onTitleChange={setSeoTitle}
            onDescriptionChange={setSeoDescription}
            fallbackTitle={name}
            fallbackDescription={description.slice(0, 160)}
          />
        </div>
      </div>
    </div>
  );
}
