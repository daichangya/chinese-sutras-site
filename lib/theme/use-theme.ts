/**
 * 全站主题切换 hook（header / mobile nav 共用）
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useState } from "react";

export type JxTheme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<JxTheme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem("jx-theme") as JxTheme) || "light";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: JxTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("jx-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
