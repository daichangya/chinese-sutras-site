/**
 * 通用骨架屏组件 — 带闪烁动画，与项目纸色系风格一致
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

/** 骨架屏 Props */
export interface SkeletonProps {
  /** 附加 className */
  className?: string;
  /** 骨架变体 */
  variant?: "text" | "heading" | "card" | "avatar" | "button" | "line" | "circle";
  /** 文本骨架行数 */
  lines?: number;
  /** 每行宽度百分比（仅 variant="text"，默认随机） */
  widths?: string[];
  /** 自定义高度 */
  height?: string;
  /** 自定义宽度 */
  width?: string;
}

/**
 * 基础 Skeleton 元素
 */
function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--jx-border)]/60 dark:bg-[var(--jx-dark-border)]/50",
        className,
      )}
    />
  );
}

/**
 * 通用骨架屏组件
 *
 * 用法：
 *   <Skeleton variant="text" lines={3} />
 *   <Skeleton variant="card" />
 *   <Skeleton variant="avatar" />
 *   <Skeleton height="200px" />
 */
export function Skeleton({
  className,
  variant = "text",
  lines = 3,
  widths,
  height,
  width,
}: SkeletonProps) {
  switch (variant) {
    case "heading":
      return (
        <SkeletonBase
          className={cn("h-7 w-2/3 rounded-lg", height && height, width && width, className)}
        />
      );

    case "card":
      return (
        <div className={cn("animate-pulse rounded-xl border border-[var(--jx-border)]/40 bg-[var(--jx-paper-elevated)] p-5", className)}>
          {/* 卡片标题 */}
          <SkeletonBase className="mb-4 h-5 w-1/2 rounded-md" />
          {/* 内容行 */}
          <div className="space-y-3">
            <SkeletonBase className="h-4 w-full rounded" />
            <SkeletonBase className="h-4 w-[85%] rounded" />
            <SkeletonBase className="h-4 w-[60%] rounded" />
          </div>
        </div>
      );

    case "avatar":
      return (
        <SkeletonBase className={cn("size-10 rounded-full", height && height, width && width, className)} />
      );

    case "button":
      return (
        <SkeletonBase
          className={cn("h-9 w-24 rounded-full", height && height, width && width, className)}
        />
      );

    case "line":
      return (
        <SkeletonBase
          className={cn("h-px w-full rounded-none", height && height, width && width, className)}
        />
      );

    case "circle":
      return (
        <SkeletonBase
          className={cn("rounded-full", height && height, width && width, className)}
        />
      );

    case "text":
    default: {
      if (lines === 1) {
        return (
          <SkeletonBase
            className={cn(
              "h-4 w-full rounded",
              height && height,
              width && width,
              className,
            )}
          />
        );
      }

      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBase
              key={i}
              className={cn(
                "h-4 rounded",
                i === lines - 1
                  ? widths?.[i] ?? "w-2/3"
                  : widths?.[i] ?? "w-full",
              )}
            />
          ))}
        </div>
      );
    }
  }
}

/**
 * 单行/块级加载占位（loading.tsx 用）
 */
export function LoadingSkeleton({ className }: { className?: string }) {
  return <SkeletonBase className={className} />;
}

/**
 * 页面级骨架屏 — 模拟标准页面布局（标题 + 内容区域）
 */
export function PageSkeleton({
  lines = 4,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("jx-page animate-pulse", className)}>
      {/* 区块标签 */}
      <SkeletonBase className="mb-3 h-3 w-16 rounded" />
      {/* 标题 */}
      <SkeletonBase className="mb-6 h-8 w-48 rounded-lg" />
      {/* 内容区 */}
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="jx-sutra-card animate-pulse rounded-xl border border-[var(--jx-border)]/40 bg-[var(--jx-paper-elevated)] p-5"
          >
            <SkeletonBase className="mb-3 h-5 w-1/3 rounded-md" />
            <div className="space-y-2">
              <SkeletonBase className="h-4 w-full rounded" />
              <SkeletonBase className="h-4 w-[80%] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 阅读器骨架屏 — 模拟经文阅读页面
 */
export function ReaderSkeleton({
  sutraTitle,
  paragraphCount = 5,
  className,
}: {
  sutraTitle?: string;
  paragraphCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("jx-reader mx-auto px-4 py-8 animate-pulse", className)}>
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <SkeletonBase className="h-5 w-32 rounded-md" />
        <div className="flex gap-2">
          <SkeletonBase className="h-8 w-20 rounded-full" />
          <SkeletonBase className="h-8 w-20 rounded-full" />
        </div>
      </div>

      {/* 经文标题 */}
      <SkeletonBase className="mb-2 h-4 w-20 rounded" />
      <SkeletonBase
        className={cn(
          "mb-8 h-9 rounded-lg",
          sutraTitle ? "w-fit" : "w-64",
        )}
      />
      <SkeletonBase className="mb-6 h-px w-full rounded-none" />

      {/* 经文段落 */}
      <div className="space-y-6">
        {Array.from({ length: paragraphCount }).map((_, i) => (
          <div key={i} className="prose-jx">
            <SkeletonBase className="mb-2 h-3 w-8 rounded" />
            <div className="space-y-2">
              <SkeletonBase className="h-5 w-full rounded" />
              <SkeletonBase className="h-5 w-[95%] rounded" />
              <SkeletonBase className="h-5 w-[80%] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 搜索页骨架屏
 */
export function SearchSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("jx-page animate-pulse", className)}>
      {/* 标题 */}
      <SkeletonBase className="mb-3 h-3 w-16 rounded" />
      <SkeletonBase className="mb-6 h-8 w-48 rounded-lg" />
      {/* 搜索框骨架 */}
      <SkeletonBase className="mb-8 h-12 w-full max-w-2xl rounded-xl" />
      {/* 结果卡片 */}
      <div className="mt-8 space-y-4">
        <SkeletonBase className="mb-4 h-3 w-24 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="jx-sutra-card animate-pulse rounded-xl border border-[var(--jx-border)]/40 bg-[var(--jx-paper-elevated)] p-5"
          >
            <SkeletonBase className="mb-2 h-5 w-1/4 rounded-md" />
            <div className="space-y-2">
              <SkeletonBase className="h-4 w-full rounded" />
              <SkeletonBase className="h-4 w-[75%] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 聊天页骨架屏
 */
export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("jx-chat-viewport animate-pulse", className)}>
      <aside className="jx-chat-sidebar hidden lg:flex">
        <div className="px-4 pb-4 pt-4">
          <div className="mb-3 flex items-center gap-2.5">
            <SkeletonBase className="size-9 rounded-lg" />
            <div className="space-y-1.5">
              <SkeletonBase className="h-4 w-16 rounded" />
              <SkeletonBase className="h-3 w-12 rounded" />
            </div>
          </div>
          <SkeletonBase className="h-8 w-full rounded-lg" />
        </div>
        <div className="flex-1 space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBase key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <main className="jx-chat-main">
        <div className="jx-chat-header">
          <SkeletonBase className="h-5 w-24 rounded" />
          <SkeletonBase className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <SkeletonBase className="mb-5 size-16 rounded-full" />
          <SkeletonBase className="mb-2 h-3 w-16 rounded" />
          <SkeletonBase className="mb-2 h-6 w-32 rounded" />
          <SkeletonBase className="h-4 w-64 max-w-full rounded" />
          <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBase key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="jx-chat-dock">
          <SkeletonBase className="mx-auto h-20 max-w-3xl w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

/**
 * 字典页骨架屏
 */
export function DictionarySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("jx-page animate-pulse", className)}>
      {/* 标题 */}
      <SkeletonBase className="mb-3 h-3 w-16 rounded" />
      <SkeletonBase className="mb-6 h-8 w-48 rounded-lg" />
      {/* 搜索框骨架 */}
      <SkeletonBase className="mb-8 h-12 w-full max-w-2xl rounded-xl" />
      {/* 快速开始提示 */}
      <div className="animate-pulse rounded-xl border border-[var(--jx-border)]/40 bg-[var(--jx-paper-elevated)] p-6">
        <SkeletonBase className="mb-3 h-4 w-24 rounded" />
        <div className="space-y-2">
          <SkeletonBase className="h-4 w-full rounded" />
          <SkeletonBase className="h-4 w-[90%] rounded" />
          <SkeletonBase className="h-4 w-[70%] rounded" />
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBase key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 书签页骨架屏
 */
export function BookmarksSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("jx-page animate-pulse", className)}>
      {/* 标题 */}
      <SkeletonBase className="mb-3 h-3 w-16 rounded" />
      <SkeletonBase className="mb-6 h-8 w-36 rounded-lg" />
      {/* 书签列表 */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="jx-sutra-card animate-pulse rounded-xl border border-[var(--jx-border)]/40 bg-[var(--jx-paper-elevated)] px-5 py-5 flex items-center justify-between"
          >
            <div className="flex-1 space-y-2">
              <SkeletonBase className="h-5 w-1/3 rounded-md" />
              <SkeletonBase className="h-4 w-2/3 rounded" />
            </div>
            <SkeletonBase className="h-8 w-16 rounded-md ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
