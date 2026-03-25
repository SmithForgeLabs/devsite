import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@devsite.it" },
    update: {},
    create: {
      email: "admin@devsite.it",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const editorPassword = await bcrypt.hash("Editor1234!", 12);
  await prisma.user.upsert({
    where: { email: "editor@devsite.it" },
    update: {},
    create: {
      email: "editor@devsite.it",
      passwordHash: editorPassword,
      role: Role.EDITOR,
    },
  });

  const landing = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      slug: "home",
      title: "Home",
      type: "LANDING",
      status: "PUBLISHED",
    },
  });

  await prisma.block.deleteMany({ where: { pageId: landing.id } });
  await prisma.block.createMany({
    data: [
      {
        pageId: landing.id,
        type: "hero",
        order: 0,
        content: {
          titleKey: "home.hero.title",
          subtitleKey: "home.hero.subtitle",
          ctaKey: "home.hero.cta",
          ctaHref: "/shop",
          bgImage: null,
        },
      },
      {
        pageId: landing.id,
        type: "features",
        order: 1,
        content: {
          items: [
            { iconKey: "star", labelKey: "home.features.quality" },
            { iconKey: "truck", labelKey: "home.features.delivery" },
            { iconKey: "shield", labelKey: "home.features.security" },
          ],
        },
      },
    ],
  });

  const category = await prisma.category.upsert({
    where: { slug: "generale" },
    update: {},
    create: { name: "Generale", slug: "generale" },
  });

  await prisma.product.upsert({
    where: { slug: "prodotto-esempio" },
    update: {},
    create: {
      slug: "prodotto-esempio",
      name: "Prodotto di Esempio",
      description: "Questo è un prodotto di esempio.",
      price: 29.99,
      stock: 100,
      categoryId: category.id,
      status: "PUBLISHED",
    },
  });

  await prisma.post.upsert({
    where: { slug: "benvenuto" },
    update: {},
    create: {
      slug: "benvenuto",
      title: "Benvenuto nel nostro sito",
      content: "<p>Questo è il primo articolo del blog.</p>",
      authorId: admin.id,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tags: ["benvenuto", "news"],
    },
  });

  console.warn("✅ Seed completato");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
