import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostEditor from "@/components/admin/editor/PostEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true } });
  return { title: post ? `Modifica: ${post.title} — Admin` : "Post non trovato" };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (!post) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">Modifica post</h1>
      <PostEditor
        postId={post.id}
        initialData={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt ?? "",
          status: post.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          featuredImage: post.featuredImage ?? null,
          featuredImageKey: post.featuredImage ?? null,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          tags: post.tags as string[],
          categoryIds: [],
          publishedAt: post.publishedAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
