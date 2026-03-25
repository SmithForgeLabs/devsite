"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

interface CategoryPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

function buildTree(flat: Category[]): Category[] {
  const map = new Map<string, Category>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Category[] = [];
  map.forEach((cat) => {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });
  return roots;
}

function CategoryNode({
  cat,
  depth,
  selected,
  onToggle,
}: {
  cat: Category;
  depth: number;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (cat.children?.length ?? 0) > 0;

  return (
    <div>
      <label
        className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:text-[#2271b1]"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight
              size={12}
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
        {!hasChildren && <span className="w-3" />}
        <input
          type="checkbox"
          checked={selected.includes(cat.id)}
          onChange={() => onToggle(cat.id)}
          className="accent-[#2271b1]"
        />
        <span className="text-sm text-gray-700">{cat.name}</span>
      </label>

      {hasChildren && expanded && (
        <div>
          {cat.children!.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/categories?limit=200")
      .then((r) => r.json())
      .then((d) => setCategories(buildTree(d.categories ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
        Categorie
      </div>
      <div className="p-3 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-gray-400">Caricamento...</p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-gray-400">Nessuna categoria</p>
        ) : (
          categories.map((cat) => (
            <CategoryNode
              key={cat.id}
              cat={cat}
              depth={0}
              selected={selected}
              onToggle={toggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
