"use client";

import { useState } from "react";
import ReviewForm from "@/components/shared/ReviewForm";
import ReviewsList from "@/components/shared/ReviewsList";

interface ReviewsSectionProps {
  productId?: string;
  postId?: string;
}

export default function ReviewsSection({ productId, postId }: ReviewsSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="mt-16 border-t border-white/[0.07] pt-12">
      <h2 className="mb-8 font-heading text-xl font-bold text-white">Recensioni</h2>
      <div className="grid gap-10 lg:grid-cols-2">
        <ReviewsList productId={productId} postId={postId} refreshKey={refreshKey} />
        <div>
          <h3 className="mb-4 font-heading text-base font-semibold text-white">
            Lascia una recensione
          </h3>
          <ReviewForm
            productId={productId}
            postId={postId}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    </section>
  );
}
