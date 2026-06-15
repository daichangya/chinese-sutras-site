"use client";

/**
 * 阅读器右下角 FAB（SpeedDial）
 * @author 代长亚
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Columns2,
  Layers,
  List,
  PenLine,
  Settings2,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReaderSettingsPanel } from "@/components/reader/reader-settings-panel";
import type { ReaderPanel } from "@/components/reader/reader-panel";
import type { SpeechEngine, SpeechRate } from "@/lib/reader/speech/types";

type FabAction = {
  id: string;
  label: string;
  icon: typeof Volume2;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  testId?: string;
  hidden?: boolean;
};

export function ReaderFab({
  onOpenPanel,
  activePanel,
  onBookmark,
  bookmarked,
  bookmarkDisabled,
  onSpeech,
  speechActive,
  onFontChange,
  onPinyinChange,
  showTraditional,
  onToggleTraditional,
  hasColloquial,
  vernacular,
  onToggleVernacular,
  cloudAvailable,
  speechEngine,
  speechRate,
  onSpeechEngineChange,
  onSpeechRateChange,
  parallelHref,
  copybookHref,
  speechBarVisible,
}: {
  onOpenPanel: (panel: ReaderPanel) => void;
  activePanel: ReaderPanel;
  onBookmark: () => void;
  bookmarked: boolean;
  bookmarkDisabled?: boolean;
  onSpeech: () => void;
  speechActive?: boolean;
  onFontChange?: () => void;
  onPinyinChange?: (enabled: boolean) => void;
  showTraditional?: boolean;
  onToggleTraditional?: () => void;
  hasColloquial?: boolean;
  vernacular?: boolean;
  onToggleVernacular?: () => void;
  cloudAvailable?: boolean;
  speechEngine?: SpeechEngine;
  speechRate?: SpeechRate;
  onSpeechEngineChange?: (engine: SpeechEngine) => void;
  onSpeechRateChange?: (rate: SpeechRate) => void;
  parallelHref: string;
  copybookHref: string;
  speechBarVisible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (speechBarVisible) setExpanded(false);
  }, [speechBarVisible]);

  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const actions: FabAction[] = [
    {
      id: "speech",
      label: speechActive ? "朗读控制" : "朗读",
      icon: Volume2,
      onClick: () => {
        onSpeech();
        setExpanded(false);
      },
      active: speechActive,
      testId: "reader-tool-speech",
    },
    {
      id: "bookmark",
      label: bookmarked ? "已收藏" : "收藏",
      icon: Bookmark,
      onClick: () => {
        onBookmark();
        setExpanded(false);
      },
      active: bookmarked,
      disabled: bookmarkDisabled || bookmarked,
      testId: "reader-tool-bookmark",
    },
    {
      id: "parallel",
      label: "对读",
      icon: Columns2,
      href: parallelHref,
      testId: "reader-parallel-link",
    },
    {
      id: "copybook",
      label: "抄经",
      icon: PenLine,
      href: copybookHref,
      testId: "reader-copybook-link",
    },
    {
      id: "toc",
      label: "目录",
      icon: List,
      onClick: () => {
        onOpenPanel(activePanel === "toc" ? null : "toc");
        setExpanded(false);
      },
      active: activePanel === "toc",
      testId: "reader-tool-toc",
      hidden: false,
    },
    {
      id: "comprehension",
      label: "理解",
      icon: Sparkles,
      onClick: () => {
        onOpenPanel(activePanel === "comprehension" ? null : "comprehension");
        setExpanded(false);
      },
      active: activePanel === "comprehension",
      testId: "reader-tool-comprehension",
      hidden: false,
    },
    {
      id: "settings",
      label: "设置",
      icon: Settings2,
      onClick: () => {
        setSettingsOpen(true);
        setExpanded(false);
      },
      testId: "reader-settings-menu",
    },
  ];

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "jx-reader-fab",
          speechBarVisible && "jx-reader-fab--with-speech",
        )}
        data-testid="reader-fab"
        role="toolbar"
        aria-label="阅读工具"
      >
        {expanded && (
          <div className="jx-reader-fab-actions" data-testid="reader-fab-actions">
            {actions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  action.id === "toc" || action.id === "comprehension"
                    ? "xl:hidden"
                    : undefined,
                )}
              >
                {action.href ? (
                  <Link
                    href={action.href}
                    className={cn(
                      "jx-reader-fab-action",
                      action.active && "jx-reader-fab-action--active",
                    )}
                    aria-label={action.label}
                    data-testid={action.testId}
                    onClick={() => setExpanded(false)}
                  >
                    <action.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{action.label}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "jx-reader-fab-action",
                      action.active && "jx-reader-fab-action--active",
                    )}
                    aria-label={action.label}
                    data-testid={action.testId}
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    <action.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{action.label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="jx-reader-fab-toggle"
          aria-label={expanded ? "收起阅读工具" : "展开阅读工具"}
          aria-expanded={expanded}
          data-testid="reader-fab-toggle"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Layers className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      <ReaderSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onFontChange={onFontChange}
        onPinyinChange={onPinyinChange}
        showTraditional={showTraditional}
        onToggleTraditional={onToggleTraditional}
        hasColloquial={hasColloquial}
        vernacular={vernacular}
        onToggleVernacular={onToggleVernacular}
        cloudAvailable={cloudAvailable}
        speechEngine={speechEngine}
        speechRate={speechRate}
        onSpeechEngineChange={onSpeechEngineChange}
        onSpeechRateChange={onSpeechRateChange}
      />
    </>
  );
}
