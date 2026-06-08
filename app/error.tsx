"use client";

/**
 * Next.js 15 路由级 Error Boundary
 * @author 代长亚
 */
import { AlertCircle } from "lucide-react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jx-error-bg)]">
        <AlertCircle className="h-8 w-8 text-[var(--jx-error)]" aria-hidden="true" />
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">页面加载出错</h1>
      <p className="mb-2 max-w-md text-center text-sm text-[var(--muted)]">
        抱歉，此页面加载时发生错误。请尝试重新加载。
      </p>

      {error && (
        <details className="mb-6 w-full max-w-md">
          <summary className="cursor-pointer rounded-lg px-3 py-2 text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)]">
            查看错误详情
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[var(--jx-paper-deep)] p-3 text-xs font-mono text-[var(--jx-error)]">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer rounded-full bg-[var(--jx-accent-cinnabar)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--jx-accent-cinnabar-hover)]"
        >
          重新加载
        </button>
        <a
          href="/"
          className="rounded-full border border-[var(--jx-border)] px-6 py-2.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
