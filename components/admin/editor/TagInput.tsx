"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ tags, onChange, placeholder = "Aggiungi tag..." }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 font-semibold text-sm text-gray-700">
        Tag
      </div>
      <div className="p-3">
        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-[#e7f0f7] text-[#2271b1] text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-600 transition-colors"
                  title={`Rimuovi ${tag}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2271b1]"
          />
          <button
            onClick={() => addTag(input)}
            disabled={!input.trim()}
            className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Aggiungi tag"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Premi Invio o virgola per aggiungere.</p>
      </div>
    </div>
  );
}
