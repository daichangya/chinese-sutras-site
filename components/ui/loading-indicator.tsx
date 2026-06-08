"use client";

/**
 * 异步加载指示器 — 用于 AI 对话、字典搜索、平行阅读等异步操作
 * 超过 3 秒显示预估等待时间
 * @author 代长亚
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface LoadingIndicatorProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 加载中的文字提示 */
  label?: string;
  /** 附加 className */
  className?: string;
  /** spinner 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 是否内联显示 */
  inline?: boolean;
  /** 超过此时间（ms）后显示预估时间，默认 3000 */
  delayThreshold?: number;
  /** 自定义预估时间文字 */
  estimatedLabel?: string;
}

const SIZE_MAP = {
  sm: "size-4 border",
  md: "size-5 border-2",
  lg: "size-7 border-2",
};

const LABEL_SIZE_MAP = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * 异步操作加载指示器
 *
 * 用法：
 *   <LoadingIndicator loading={isFetching} label="正在加载..." />
 */
export function LoadingIndicator({
  loading,
  label = "正在加载...",
  className,
  size = "md",
  inline = false,
  delayThreshold = 3000,
  estimatedLabel,
}: LoadingIndicatorProps) {
  const [showEstimate, setShowEstimate] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (loading) {
      startTimeRef.current = Date.now();
      setShowEstimate(false);
      const timer = setTimeout(() => setShowEstimate(true), delayThreshold);
      return () => clearTimeout(timer);
    } else {
      setShowEstimate(false);
    }
  }, [loading, delayThreshold]);

  if (!loading) return null;

  const elapsed = showEstimate
    ? Math.round((Date.now() - startTimeRef.current) / 1000)
    : 0;

  const estimate = showEstimate
    ? estimatedLabel ?? `已等待 ${elapsed} 秒，预计还需 ${Math.max(elapsed, 3)} 秒...`
    : "";

  const containerClasses = inline
    ? cn("inline-flex items-center gap-2", LABEL_SIZE_MAP[size], className)
    : cn("flex flex-col items-center justify-center gap-3 py-8", className);

  return (
    <div className={containerClasses} role="status" aria-label={label}>
      <div
        className={cn(
          "animate-spin rounded-full border-[var(--jx-muted-label)] border-t-transparent",
          SIZE_MAP[size],
        )}
      />
      <span className={cn("text-[var(--jx-muted-label)]", LABEL_SIZE_MAP[size])}>
        {label}
      </span>
      {showEstimate && estimate && (
        <span className="text-xs text-[var(--jx-muted-label)] animate-pulse">
          {estimate}
        </span>
      )}
    </div>
  );
}

/**
 * 极简行内加载指示（适合放在按钮内、表单项旁等紧凑位置）
 */
export function InlineSpinner({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-[var(--jx-muted-label)] border-t-transparent",
        size === "sm" ? "size-3.5 border" : "size-4 border-2",
        className,
      )}
      role="status"
      aria-label="加载中"
    />
  );
}
