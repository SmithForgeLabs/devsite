import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagina non trovata",
};

export default function NotFound() {
  const t = useTranslations("errors.404");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-[#FAFAF8]">
      <h1 className="font-heading text-7xl font-extrabold text-[#E5E5E3]">404</h1>
      <h2 className="mt-4 font-heading text-2xl font-semibold text-[#1A1A1A]">{t("title")}</h2>
      <p className="mt-2 text-[#6B7280]">{t("message")}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-[#18181B] px-6 py-3 text-white font-semibold transition-colors hover:bg-[#27272A]"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
