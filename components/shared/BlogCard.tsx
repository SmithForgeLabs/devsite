import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  publishedAt?: string | null;
  tags?: string[];
}

export default function BlogCard({ slug, title, excerpt, featuredImage, publishedAt, tags }: BlogCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {featuredImage && (
        <div className="relative aspect-video overflow-hidden bg-white/[0.03]">
          <Image
            src={featuredImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 gap-2">
        {publishedAt && (
          <time dateTime={publishedAt} className="text-xs text-zinc-500">
            {new Date(publishedAt).toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        )}
        <h2 className="font-heading font-semibold text-white leading-snug">
          <Link href={`/blog/${slug}`} className="transition-colors hover:text-zinc-300">
            {title}
          </Link>
        </h2>
        {excerpt && (
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{excerpt}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/blog/${slug}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Leggi di più
          <ArrowRight size={14} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
