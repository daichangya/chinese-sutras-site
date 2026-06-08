"use client";

/**
 * Next.js 15 全局 Error Boundary
 * @author 代长亚
 */
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hans">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--jx-paper)] px-4 dark:bg-[var(--jx-dark-bg)]">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--jx-error-bg)]">
            <AlertCircle className="h-10 w-10 text-[var(--jx-error)]" aria-hidden="true" />
          </div>

          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)]">系统异常</h1>
          <p className="mb-3 max-w-lg text-center text-[var(--muted)]">
            应用程序遇到了严重错误。请尝试重新加载页面，如果问题持续存在，请联系管理员。
          </p>

          {error && (
            <details className="mb-6 w-full max-w-lg">
              <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm text-[var(--jx-muted-label)] hover:text-[var(--foreground)]">
                错误详情
              </summary>
              <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-[var(--jx-paper-deep)] p-4 text-xs font-mono text-[var(--jx-error)]">
                {error.message}
                {error.digest && `\n\n错误摘要: ${error.digest}`}
              </pre>
            </details>
          )}

          <p className="mb-6 text-xs text-[var(--jx-muted-label)]">
            如果您反复遇到此问题，请截图并将上述错误信息反馈给开发团队。
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="cursor-pointer rounded-full bg-[var(--jx-accent-cinnabar)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--jx-accent-cinnabar-hover)]"
            >
              重新加载页面
            </button>
            <a
              href="/"
              className="rounded-full border border-[var(--jx-border)] px-8 py-3 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              返回首页
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
