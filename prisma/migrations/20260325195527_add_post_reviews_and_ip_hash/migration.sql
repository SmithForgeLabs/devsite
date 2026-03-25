-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "ip_hash" TEXT,
ADD COLUMN     "post_id" TEXT;

-- CreateIndex
CREATE INDEX "reviews_post_id_idx" ON "reviews"("post_id");

-- CreateIndex
CREATE INDEX "reviews_ip_hash_idx" ON "reviews"("ip_hash");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
