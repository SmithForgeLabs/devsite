import Link from "next/link";
import PageEditor from "@/components/admin/editor/PageEditor";
import CodePageEditor from "@/components/admin/editor/CodePageEditor";
import { FileText, ShoppingBag, Image as ImageIcon, Layout, Code, FileCode } from "lucide-react";

export const metadata = { title: "Nuova pagina — Admin" };

const PAGE_TYPES = [
  {
    type: "LANDING",
    label: "Landing page",
    description: "Contenuto HTML personalizzato con editor visuale.",
    icon: Layout,
  },
  {
    type: "BLOG",
    label: "Blog",
    description: "Lista degli articoli pubblicati. I post vengono mostrati automaticamente.",
    icon: FileText,
  },
  {
    type: "SHOP",
    label: "Negozio",
    description: "Griglia prodotti con filtri e categorie. I prodotti vengono mostrati automaticamente.",
    icon: ShoppingBag,
  },
  {
    type: "PORTFOLIO",
    label: "Portfolio",
    description: "Galleria dei progetti Portfolio. Le pagine portfolio vengono mostrate automaticamente.",
    icon: ImageIcon,
  },
  {
    type: "CUSTOM",
    label: "Contenuto HTML",
    description: "Pagina a contenuto libero con editor visuale e HTML.",
    icon: FileCode,
  },
  {
    type: "CODE",
    label: "Codice HTML + CSS + JS",
    description: "Editor avanzato con tre pannelli separati per HTML, CSS e JavaScript.",
    icon: Code,
  },
] as const;

type PageTypeValue = (typeof PAGE_TYPES)[number]["type"];

interface Props {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewPagePage({ searchParams }: Props) {
  const { type } = await searchParams;
  const pageType = type as PageTypeValue | undefined;

  const validTypes = PAGE_TYPES.map((t) => t.type) as string[];

  // Step 2 — show editor for chosen type
  if (pageType && validTypes.includes(pageType)) {
    const typeLabel = PAGE_TYPES.find((t) => t.type === pageType)?.label ?? pageType;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages/new"
            className="text-sm text-[#2271b1] hover:underline"
          >
            ← Cambia tipo
          </Link>
          <span className="text-gray-400 text-sm">/</span>
          <h1 className="text-xl font-semibold text-gray-800">
            Nuova pagina — {typeLabel}
          </h1>
        </div>
        {pageType === "CODE" ? (
          <CodePageEditor />
        ) : (
          <PageEditor initialData={{ type: pageType }} />
        )}
      </div>
    );
  }

  // Step 1 — type wizard
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Aggiungi nuova pagina</h1>
        <p className="mt-1 text-sm text-gray-500">Scegli il tipo di pagina da creare.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAGE_TYPES.map(({ type: t, label, description, icon: Icon }) => (
          <Link
            key={t}
            href={`/admin/pages/new?type=${t}`}
            className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#2271b1] hover:shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-[#f0f7ff] p-2 text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-gray-800">{label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

