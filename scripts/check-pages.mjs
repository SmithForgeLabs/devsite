import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const pages = await p.page.findMany({ select: { id: true, title: true, slug: true, status: true } });
console.log(JSON.stringify(pages, null, 2));
await p.$disconnect();
