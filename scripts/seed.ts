import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Upsert the Home page ──────────────────────────────────────────────
  await prisma.page.upsert({
    where: { slug: "home" },
    update: {}, // never overwrite manual edits to the home page
    create: {
      slug: "home",
      title: "Home",
      type: "HOME",
      status: "PUBLISHED",
      isSystem: true,
      content: "",
    },
  });

  // ── 2. Seed nav_items only if the setting is not yet populated ───────────
  const navSetting = await prisma.setting.findUnique({ where: { key: "nav_items" } });

  if (!navSetting) {
    await prisma.setting.create({
      data: {
        key: "nav_items",
        value: [
          { id: "nav-home", label: "Home", href: "/", type: "link", order: 0 },
        ],
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
