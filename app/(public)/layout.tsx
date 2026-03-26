import SiteNavbar from "@/components/shared/SiteNavbar";
import Footer from "@/components/shared/Footer";
import ReviewsMarqueeSection from "@/components/shared/ReviewsMarqueeSection";
import { prisma } from "@/lib/prisma";
import type { NavItem, LogoShape } from "@/lib/nav/types";

async function getSiteSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["site_name", "logo", "nav_items", "logo_shape"] } },
    });
    const map: Record<string, unknown> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    const siteName = typeof map.site_name === "string"
      ? map.site_name.replace(/^"|"$/g, "")
      : String(map.site_name ?? "DevSite").replace(/^"|"$/g, "");
    const logoUrl = typeof map.logo === "string"
      ? map.logo.replace(/^"|"$/g, "")
      : "";
    const logoShape = (typeof map.logo_shape === "string"
      ? map.logo_shape.replace(/^"|"$/g, "")
      : "square") as LogoShape;
    const navItems: NavItem[] = Array.isArray(map.nav_items) ? (map.nav_items as NavItem[]) : [];

    return { siteName: siteName || "DevSite", logoUrl, logoShape, navItems };
  } catch {
    return { siteName: "DevSite", logoUrl: "", logoShape: "square" as LogoShape, navItems: [] };
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { siteName, logoUrl, logoShape, navItems } = await getSiteSettings();
  return (
    <div className="relative flex min-h-screen flex-col" style={{ zIndex: 1 }}>
      <SiteNavbar siteName={siteName} logoUrl={logoUrl} logoShape={logoShape} navItems={navItems} />
      <main className="flex-1">{children}</main>
      <ReviewsMarqueeSection />
      <Footer />
    </div>
  );
}
