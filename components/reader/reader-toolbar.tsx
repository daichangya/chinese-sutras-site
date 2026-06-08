/**
 * 阅读器顶栏图标工具带
 * @author 代长亚
 */
"use client";

import {
  Bookmark,
  Columns2,
  GitCompare,
  Languages,
  List,
  Minus,
  PenLine,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { ToolIconButton } from "@/components/ui/tool-icon-button";
import { ReaderSettingsMenu } from "@/components/reader/reader-settings-menu";
import { stepFontSize } from "@/components/reader/reader-preferences";

export type ReaderPanel = "toc" | "comprehension" | null;

function ToolbarDivider() {
  return (
    <span className="mx-0.5 hidden h-5 w-px bg-[var(--jx-border)] sm:inline" aria-hidden="true" />
  );
}

export function ReaderToolbar({
  onOpenPanel,
  activePanel,
  onFontDown,
  onFontUp,
  onBookmark,
  onShare,
  bookmarked,
  bookmarkDisabled,
  parallelHref,
  copybookHref,
  hasColloquial,
  vernacular,
  onToggleVernacular,
  showTraditional,
  onToggleTraditional,
  onPinyinChange,
}: {
  onOpenPanel: (panel: ReaderPanel) => void;
  activePanel: ReaderPanel;
  onFontDown: () => void;
  onFontUp: () => void;
  onBookmark: () => void;
  onShare: () => void;
  bookmarked: boolean;
  bookmarkDisabled?: boolean;
  parallelHref: string;
  copybookHref: string;
  hasColloquial?: boolean;
  vernacular?: boolean;
  onToggleVernacular?: () => void;
  showTraditional?: boolean;
  onToggleTraditional?: () => void;
  onPinyinChange?: (enabled: boolean) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-2"
      role="toolbar"
      aria-label="阅读工具"
      data-testid="reader-toolbar"
    >
      <div className="xl:hidden">
        <ToolIconButton
          icon={List}
          label="目录"
          text="目录"
          active={activePanel === "toc"}
          onClick={() => onOpenPanel(activePanel === "toc" ? null : "toc")}
          testId="reader-tool-toc"
        />
      </div>

      <ToolbarDivider />

      <ToolIconButton
        icon={Minus}
        label="缩小字号"
        text="A−"
        onClick={() => {
          stepFontSize(-1);
          onFontDown();
        }}
        testId="reader-tool-font-down"
      />
      <ToolIconButton
        icon={Plus}
        label="放大字号"
        text="A+"
        onClick={() => {
          stepFontSize(1);
          onFontUp();
        }}
        testId="reader-tool-font-up"
      />
      {onToggleTraditional && (
        <ToolIconButton
          icon={Languages}
          label={showTraditional ? "切换简体" : "切换繁体"}
          text={showTraditional ? "简" : "繁"}
          active={showTraditional}
          onClick={onToggleTraditional}
          testId="reader-tool-traditional"
        />
      )}
      {hasColloquial && onToggleVernacular && (
        <ToolIconButton
          icon={GitCompare}
          label={vernacular ? "切换原文" : "切换白话"}
          text={vernacular ? "原文" : "白话"}
          active={vernacular}
          onClick={onToggleVernacular}
          testId="reader-tool-vernacular"
        />
      )}

      <ToolbarDivider />

      <ToolIconButton
        icon={Bookmark}
        label={bookmarked ? "已收藏" : "收藏此经"}
        text={bookmarked ? "已收藏" : "收藏"}
        active={bookmarked}
        onClick={onBookmark}
        disabled={bookmarkDisabled || bookmarked}
        testId="reader-tool-bookmark"
      />
      <ToolIconButton
        icon={Share2}
        label="分享当前段"
        text="分享"
        onClick={onShare}
        testId="reader-tool-share"
      />

      <ToolbarDivider />

      <ToolIconButton
        icon={Columns2}
        label="平行阅读"
        text="对读"
        href={parallelHref}
        testId="reader-parallel-link"
      />
      <ToolIconButton
        icon={PenLine}
        label="开始抄经"
        text="抄经"
        href={copybookHref}
        testId="reader-copybook-link"
      />

      <div className="xl:hidden">
        <ToolbarDivider />
        <ToolIconButton
          icon={Sparkles}
          label="理解辅助"
          text="理解"
          active={activePanel === "comprehension"}
          onClick={() => onOpenPanel(activePanel === "comprehension" ? null : "comprehension")}
          testId="reader-tool-comprehension"
        />
      </div>

      <ToolbarDivider />
      <ReaderSettingsMenu onPinyinChange={onPinyinChange} />
    </div>
  );
}
