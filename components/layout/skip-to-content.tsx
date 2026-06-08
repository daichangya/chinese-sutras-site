/**
 * Skip to Content 链接（WCAG 2.1 2.4.1 Bypass Blocks）
 * 页面顶部隐藏链接，聚焦时显示在视口最上方。
 * @author 代长亚
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-[var(--jx-paper-elevated)] focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-[var(--foreground)] focus:shadow-lg focus:outline-none focus:outline-2 focus:outline-[var(--jx-accent)] focus:outline-offset-2"
    >
      跳转到主要内容
    </a>
  );
}
