"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** 错误边界渲染回退组件的 Props */
export interface FallbackProps {
  /** 捕获到的错误对象 */
  error: Error & { digest?: string };
  /** 重置错误状态，触发重新渲染 */
  onReset: () => void;
}

/** 局部 Error Boundary Props */
interface ErrorBoundaryProps {
  /** 子节点 */
  children: ReactNode;
  /** 自定义回退内容，接收 FallbackProps */
  fallback?: ((props: FallbackProps) => ReactNode) | ReactNode;
  /** 错误发生时回调（用于埋点/上报） */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 重置时回调 */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: (Error & { digest?: string }) | null;
}

/**
 * 通用 Error Boundary 组件（class component）
 * 捕获子组件树中任意位置的同步渲染错误、生命周期错误、构造函数错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error & { digest?: string }): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error & { digest?: string }, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] 组件渲染错误:", error, errorInfo.componentStack);
  }

  /** 重置错误状态，尝试重新渲染 */
  handleReset(): void {
    this.setState({ error: null });
    this.props.onReset?.();
  }

  render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") {
        return fallback({ error: this.state.error, onReset: this.handleReset });
      }
      if (fallback) {
        return fallback;
      }
      return (
        <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}

/**
 * 默认错误回退 UI（中文，适配暗色模式，含重试按钮）
 * 重试按钮调用 onReset（即 Next.js error.tsx 中的 reset）
 */
function DefaultErrorFallback({ error, onReset }: FallbackProps) {
  /** 根据错误消息判断可能的原因 */
  const getHint = (err: Error & { digest?: string }): string | null => {
    const msg = err.message?.toLowerCase() ?? "";
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("econnrefused")) {
      return "网络连接异常，请检查网络后重试。";
    }
    if (msg.includes("not found") || msg.includes("404")) {
      return "请求的资源不存在，请确认链接是否正确。";
    }
    if (msg.includes("timeout")) {
      return "请求超时，服务器响应较慢，请稍后重试。";
    }
    if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("403")) {
      return "权限不足，请确认登录后重试。";
    }
    return null;
  };

  const hint = getHint(error);

  return (
    <div
      role="alert"
      className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-8 text-center"
    >
      {/* 错误图标 */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--jx-error-bg)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-[var(--jx-error)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
        页面加载出错
      </h2>
      <p className="mb-2 max-w-md text-sm text-[var(--muted)]">
        抱歉，此部分内容加载失败。您可以点击下方按钮重试。
      </p>
      {hint && (
        <p className="mb-3 max-w-md rounded-lg bg-[rgb(139_37_0/0.06)] px-3 py-2 text-xs text-[var(--jx-accent-cinnabar)] dark:bg-[rgb(196_74_42/0.15)] dark:text-[var(--jx-gold)]">
          {hint}
        </p>
      )}
      {error && (
        <details className="mb-4 w-full max-w-md">
          <summary className="cursor-pointer text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)]">
            查看错误详情
          </summary>
          <p className="mt-2 rounded-lg bg-[var(--jx-paper)] px-3 py-2 text-xs font-mono text-[var(--jx-error)]">
            {error.message}
          </p>
        </details>
      )}
      {error.digest && (
        <p className="mb-4 text-xs text-[var(--jx-muted-label)]">
          错误摘要: {error.digest}
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          重试
        </Button>
      </div>
    </div>
  );
}

/**
 * withErrorBoundary HOC
 * 将任意函数组件包裹在 Error Boundary 中
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const { fallback, onError, onReset } = options ?? {};
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError} onReset={onReset}>
        <WrappedComponent {...(props as P)} />
      </ErrorBoundary>
    );
  };
}
