/**
 * 关于页：统一 jx-page / jx-section-label 视觉
 * @author jingxin
 */
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="jx-page">
      <header className="mb-10">
        <p className="jx-section-label">关于</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">关于静心</h1>
      </header>
      <div className="prose-jx max-w-none text-base">
        <p>
          静心（jingxin）是一个现代化的佛经阅读与理解平台，帮助普通读者与初学者更容易读懂经典，而非替代专业佛学研究或法师开示。
        </p>
        <p className="jx-section-label mt-10 mb-3">经文版权</p>
        <p>
          本站经文底本来自 CBETA 电子佛典集成（中华电子佛典协会）。使用与转载请遵循{" "}
          <a
            href="https://www.cbeta.org/copyright.php"
            className="text-amber-900 underline underline-offset-2 dark:text-amber-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            CBETA 版权说明
          </a>
          。
        </p>
        <p className="jx-section-label mt-10 mb-3">AI 说明</p>
        <p>白话译文与划选解释由 AI 辅助生成，可能存在偏差，仅供学习参考。</p>
      </div>
      <p className="mt-12 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">
          返回首页
        </Link>
      </p>
    </div>
  );
}
