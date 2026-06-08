/**
 * 大经分卷导航
 * @author 代长亚
 */
import Link from "next/link";

export function ChapterNav({
  slug,
  chapters,
  current,
  totalParagraphs,
}: {
  slug: string;
  chapters: number[];
  current: number;
  totalParagraphs: number;
}) {
  if (chapters.length <= 1 && totalParagraphs <= 300) return null;

  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm"
      aria-label="分卷导航"
    >
      <span className="text-[var(--muted)]">分卷</span>
      {chapters.map((seq) => (
        <Link
          key={seq}
          href={seq === 0 ? `/sutra/${slug}` : `/sutra/${slug}?chapter=${seq}`}
          className={`rounded-md px-2.5 py-1 transition ${
            seq === current
              ? "bg-[var(--jx-accent-cinnabar)] text-white dark:bg-[var(--jx-accent-cinnabar)]"
              : "hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          {seq + 1}
        </Link>
      ))}
      <span className="ml-auto text-xs text-[var(--muted)]">本卷 {totalParagraphs} 段</span>
    </nav>
  );
}
