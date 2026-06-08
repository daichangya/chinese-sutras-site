/**
 * 全站页脚（Medium 式简洁 + 无尽藏式纸色温度）
 * @author 代长亚
 */
import Link from "next/link";
import { brandFooterLabel, BRAND_AUTHOR_EMAIL, BRAND_AUTHOR_NAME, BRAND_REPO_URL } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--jx-border)] bg-[var(--jx-paper-deep)]/50 py-10 text-center text-sm text-[var(--jx-muted-label)] transition-colors">
      <div className="jx-shell jx-ui-shell">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-sm opacity-30">◎</span>
          <span className="font-medium tracking-wide">{brandFooterLabel()}</span>
        </div>
        <p className="text-[var(--jx-muted-label)]">
          让佛经更容易读懂
        </p>
        <p className="mt-4 text-xs text-[var(--jx-muted-label)]">
          经文底本来自{" "}
          <a
            href="https://www.cbeta.org/copyright.php"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--foreground)] transition-colors"
          >
            CBETA 电子佛典基金会
            <span className="sr-only">（在新窗口中打开）</span>
          </a>
          ，仅供非商业学习使用。
        </p>
        <p className="mt-3 text-xs text-[var(--jx-muted-label)]">
          © {new Date().getFullYear()} {BRAND_AUTHOR_NAME} ·{" "}
          <a
            href={`mailto:${BRAND_AUTHOR_EMAIL}`}
            className="underline hover:text-[var(--foreground)] transition-colors"
          >
            {BRAND_AUTHOR_EMAIL}
          </a>
          {" · "}
          <a
            href={BRAND_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[var(--foreground)] transition-colors"
          >
            GitHub
            <span className="sr-only">（在新窗口中打开）</span>
          </a>
        </p>
        <p className="mt-3 text-xs">
          <Link href="/about" className="underline hover:text-[var(--foreground)] transition-colors">
            关于与版权
          </Link>
        </p>
      </div>
    </footer>
  );
}
