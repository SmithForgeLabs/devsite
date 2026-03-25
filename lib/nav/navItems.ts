import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import type { NavItem } from "./types";

export type { NavItem } from "./types";
export type { LogoShape } from "./types";

const MAX_NAV_ITEMS = 7;
const NAV_SETTING_KEY = "nav_items";


const DEFAULT_NAV: NavItem[] = [
  { id: "default-home", label: "Home", href: "/", type: "link", order: 0 },
  { id: "default-blog", label: "Blog", href: "/blog", type: "link", order: 1 },
  { id: "default-portfolio", label: "Portfolio", href: "/portfolio", type: "link", order: 2 },
  { id: "default-shop", label: "Negozio", href: "/shop", type: "link", order: 3 },
];


export async function getNavItems(): Promise<NavItem[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: NAV_SETTING_KEY } });
    if (!row) return DEFAULT_NAV;

    const parsed = row.value as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_NAV;

    return parsed as NavItem[];
  } catch {
    return DEFAULT_NAV;
  }
}


export async function saveNavItems(items: NavItem[]): Promise<void> {
  // Re-index order
  const ordered = items.map((item, i) => ({
    ...item,
    order: i,
    children: item.children?.map((child, ci) => ({ ...child, order: ci })),
  }));

  await prisma.setting.upsert({
    where: { key: NAV_SETTING_KEY },
    update: { value: ordered as unknown as Parameters<typeof prisma.setting.upsert>[0]["update"]["value"] },
    create: { key: NAV_SETTING_KEY, value: ordered as unknown as Parameters<typeof prisma.setting.create>[0]["data"]["value"] },
  });
}


export async function addNavItem(item: Omit<NavItem, "id" | "order">): Promise<boolean> {
  const current = await getNavItems();

  // Already at limit
  if (current.length >= MAX_NAV_ITEMS) return false;

  // Deduplicate by href (don't add same link twice)
  if (item.href && current.some((n) => n.href === item.href)) return false;
  if (item.href && current.some((n) => n.children?.some((c) => c.href === item.href))) return false;

  const newItem: NavItem = {
    id: randomUUID(),
    label: item.label,
    href: item.href,
    type: item.type,
    order: current.length,
    children: item.children,
  };

  await saveNavItems([...current, newItem]);
  return true;
}


export { MAX_NAV_ITEMS, NAV_SETTING_KEY, DEFAULT_NAV };
