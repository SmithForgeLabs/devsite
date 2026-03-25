"use client";

import { useDevice } from "@/lib/device/useDevice";
import PcNavbar from "@/components/pc/PcNavbar";
import PhoneNavbar from "@/components/phone/PhoneNavbar";
import type { NavItem, LogoShape } from "@/lib/nav/types";

interface Props {
  siteName?: string;
  logoUrl?: string;
  logoShape?: LogoShape;
  navItems?: NavItem[];
}

export default function SiteNavbar({ siteName, logoUrl, logoShape, navItems }: Props) {
  const { device } = useDevice();
  return device === "phone"
    ? <PhoneNavbar siteName={siteName} logoUrl={logoUrl} logoShape={logoShape} navItems={navItems} />
    : <PcNavbar siteName={siteName} logoUrl={logoUrl} logoShape={logoShape} navItems={navItems} />;
}
