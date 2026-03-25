import { prisma } from "@/lib/prisma";
import ReviewsMarquee from "@/components/shared/ReviewsMarquee";

export default async function ReviewsMarqueeSection() {
  const setting = await prisma.setting.findUnique({ where: { key: "show_reviews_marquee" } });
  const v = setting?.value;
  const enabled = v === true || v === "true" || v === 1;
  if (!enabled) return null;

  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, rating: true, content: true, authorName: true, createdAt: true },
  });

  if (reviews.length === 0) return null;

  return (
    <ReviewsMarquee
      reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
    />
  );
}
