import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!existing) {
    console.warn(`⚠️  User ${email} not found — skipping admin promotion.`);
    return;
  }
  if (existing.role === "ADMIN") {
    console.log(`ℹ️  User ${email} is already ADMIN.`);
    return;
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { id: true, email: true, role: true },
  });

  console.log(`✅ User promoted to ADMIN:`, user);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
