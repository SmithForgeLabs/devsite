// Shared NavItem type — used by both server (lib/nav/navItems.ts) and client components
export interface NavItem {
  id: string;
  label: string;
  href: string | null;
  type: "link" | "dropdown";
  order: number;
  children?: NavItem[];
}

export type LogoShape = "square" | "rounded" | "circle";
