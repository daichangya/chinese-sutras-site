"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Prefs = {
  theme: "light" | "dark";
  font: "sm" | "md" | "lg";
  leading: "normal" | "relaxed" | "loose";
  pinyin: boolean;
};

const FONT_SCALE = { sm: 0.9, md: 1, lg: 1.15 } as const;
const LEADING = { normal: 1.5, relaxed: 1.75, loose: 2 } as const;

function loadPrefs(): Prefs {
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

function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  root.classList.toggle("dark", p.theme === "dark");
  root.style.setProperty("--jx-font-scale", String(FONT_SCALE[p.font]));
  root.style.setProperty("--jx-leading", String(LEADING[p.leading]));
}

export function ReaderPreferences({
  onPinyinChange,
}: {
  onPinyinChange?: (enabled: boolean) => void;
}) {
  const [prefs, setPrefs] = useState<Prefs>({ theme: "light", font: "md", leading: "relaxed", pinyin: false });

  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyPrefs(p);
    onPinyinChange?.(p.pinyin);
  }, [onPinyinChange]);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem("jx-theme", next.theme);
    localStorage.setItem("jx-font", next.font);
    localStorage.setItem("jx-leading", next.leading);
    localStorage.setItem("jx-pinyin", next.pinyin ? "1" : "0");
    if (patch.pinyin !== undefined) onPinyinChange?.(next.pinyin);
    applyPrefs(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Button variant="outline" size="sm" type="button" onClick={() => update({ theme: prefs.theme === "dark" ? "light" : "dark" })}>
        {prefs.theme === "dark" ? "日间" : "夜间"}
      </Button>
      <Button variant="outline" size="sm" type="button" onClick={() => update({ font: prefs.font === "sm" ? "md" : prefs.font === "md" ? "lg" : "sm" })}>
        字号
      </Button>
      <Button variant="outline" size="sm" type="button" onClick={() => update({ leading: prefs.leading === "normal" ? "relaxed" : prefs.leading === "relaxed" ? "loose" : "normal" })}>
        行距
      </Button>
      <Button
        variant={prefs.pinyin ? "default" : "outline"}
        size="sm"
        type="button"
        className={prefs.pinyin ? "bg-amber-800 hover:bg-amber-900" : ""}
        onClick={() => update({ pinyin: !prefs.pinyin })}
      >
        拼音
      </Button>
    </div>
  );
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
      <div className="h-full bg-amber-700 dark:bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}
