"use client";

import { useEffect, useState } from "react";

type Prefs = {
  theme: "light" | "dark";
  font: "sm" | "md" | "lg";
  leading: "normal" | "relaxed" | "loose";
  pinyin: boolean;
};

const FONT_SCALE = { sm: 0.9, md: 1, lg: 1.15 } as const;
const LEADING = { normal: 1.5, relaxed: 1.75, loose: 2 } as const;
const FONT_ORDER: Prefs["font"][] = ["sm", "md", "lg"];

export function loadReaderPrefs(): Prefs {
  if (typeof window === "undefined") {
    return { theme: "light", font: "md", leading: "relaxed", pinyin: false };
  }
  return {
    theme: (localStorage.getItem("jx-theme") as Prefs["theme"]) || "light",
    font: (localStorage.getItem("jx-font") as Prefs["font"]) || "md",
    leading: (localStorage.getItem("jx-leading") as Prefs["leading"]) || "relaxed",
    pinyin: localStorage.getItem("jx-pinyin") === "1",
  };
}

/** 更新行距 / 拼音等偏好（不含主题，主题由顶栏控制） */
export function updateReaderPrefs(patch: Partial<Pick<Prefs, "leading" | "pinyin" | "font">>) {
  const next = { ...loadReaderPrefs(), ...patch };
  if (patch.leading !== undefined) localStorage.setItem("jx-leading", next.leading);
  if (patch.pinyin !== undefined) localStorage.setItem("jx-pinyin", next.pinyin ? "1" : "0");
  if (patch.font !== undefined) localStorage.setItem("jx-font", next.font);
  applyPrefs(next);
  return next;
}

function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  root.classList.toggle("dark", p.theme === "dark");
  root.style.setProperty("--jx-font-scale", String(FONT_SCALE[p.font]));
  root.style.setProperty("--jx-leading", String(LEADING[p.leading]));
}

/** 步进字号（供工具栏 A± 使用） */
export function stepFontSize(delta: -1 | 1) {
  const p = loadReaderPrefs();
  const idx = FONT_ORDER.indexOf(p.font);
  const next = FONT_ORDER[Math.max(0, Math.min(FONT_ORDER.length - 1, idx + delta))];
  const nextPrefs = { ...p, font: next };
  localStorage.setItem("jx-font", next);
  applyPrefs(nextPrefs);
  return next;
}

/** 初始化阅读偏好（字号、行距、拼音；主题由顶栏控制） */
export function useReaderPrefsInit(onPinyinChange?: (enabled: boolean) => void) {
  useEffect(() => {
    const p = loadReaderPrefs();
    applyPrefs(p);
    onPinyinChange?.(p.pinyin);
  }, [onPinyinChange]);
}

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-stone-200 dark:bg-stone-800">
      <div className="h-full bg-[var(--jx-accent-cinnabar)] dark:bg-[rgb(139_37_0/0.06)]0 transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}
