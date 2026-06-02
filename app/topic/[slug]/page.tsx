/**
 * 专题页：导读式布局（大藏经AI风格）
 * @author jingxin
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getSqlite();
  const topic = db
    .prepare(`SELECT id, slug, title, description, intro_md as introMd FROM topic WHERE slug = ?`)
    .get(slug) as
    | { id: string; slug: string; title: string; description: string; introMd: string | null }
    | undefined;

  if (!topic) notFound();

  const items = db
    .prepare(
      `
    SELECT s.slug, s.title, s.translator, s.category, ti.sort_order as sortOrder, ti.quote
    FROM topic_item ti
    JOIN sutra s ON s.id = ti.sutra_id
    WHERE ti.topic_id = ?
    ORDER BY ti.sort_order
  `,
    )
    .all(topic.id) as Array<{
      slug: string;
      title: string;
      translator: string | null;
      category: string | null;
      sortOrder: number;
      quote: string | null;
    }>;

  return (
    <div className="jx-page animate-jx-fade">
      {/* 面包屑 */}
      <nav className="mb-6 text-xs text-[var(--jx-muted-label)] flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--foreground)] transition-colors">首页</Link>
        <span>/</span>
        <span>专题阅读</span>
        <span>/</span>
        <span className="text-[var(--foreground)]">{topic.title}专题</span>
      </nav>

      {/* Hero — 无尽藏式专题首屏 */}
      <header className="jx-topic-hero share-card rounded-2xl border border-amber-200/50 px-8 py-12 dark:border-amber-900/40">
        <p className="jx-section-label text-amber-800/80 dark:text-amber-400/80 mb-3">专题阅读</p>
        <h1 className="text-3xl md:text-4xl font-normal tracking-tight">{topic.title}</h1>
        <p className="mt-3 text-[var(--muted)] leading-relaxed max-w-lg">{topic.description}</p>
        {items.length > 0 && (
          <p className="mt-4 text-xs text-[var(--jx-muted-label)]">
            {items.length} 部经 · 阅读路径
          </p>
        )}
      </header>

      {/* 导读 */}
      {topic.introMd && (
        <section className="mt-10 prose-jx whitespace-pre-wrap text-base leading-relaxed">
          {topic.introMd.replace(/^## /gm, "").split("\n").map((line, i) =>
            line.startsWith("什么是") || line.startsWith("净土") ? (
              <h2 key={i} className="mb-3 mt-8 text-lg font-medium not-italic first:mt-0">
                {line}
              </h2>
            ) : (
              <p key={i} className="text-[var(--muted)]">
                {line}
              </p>
            ),
          )}
        </section>
      )}

      {/* 推荐经目 */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <p className="jx-section-label">推荐经目</p>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
        </div>
        <ol data-testid="topic-sutra-list" className="space-y-3">
          {items.length === 0 && (
            <li className="text-center py-12">
              <p className="text-4xl mb-4 opacity-30">📖</p>
              <p className="text-[var(--muted)] text-lg">暂无推荐经目</p>
              <p className="text-sm text-[var(--jx-muted-label)] mt-1">后续会陆续补充，敬请期待。</p>
            </li>
          )}
          {items.map((item, idx) => (
            <li key={item.slug} className="animate-jx-fade" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "backwards" }}>
              <Link href={`/sutra/${item.slug}`} className="jx-sutra-card group block px-5 py-4.5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-xs text-[var(--jx-muted-label)] font-mono w-6 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-medium group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {[item.translator, item.category].filter(Boolean).join(" · ")}
                    </p>
                    {item.quote && (
                      <p className="mt-2 text-sm italic leading-relaxed text-stone-600 dark:text-stone-400 border-l-2 border-amber-500/60 pl-3">
                        {item.quote}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline transition-colors">
          返回首页
        </Link>
      </p>
    </div>
  );
}
