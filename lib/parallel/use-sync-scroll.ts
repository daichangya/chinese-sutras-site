"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 双栏滚动同步 hook
 * 按比例同步两个滚动容器的位置，支持锁定/解锁
 */
export function useSyncScroll(locked = true) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const [isLocked, setIsLocked] = useState(locked);

  const syncScroll = useCallback(
    (source: "left" | "right") => {
      if (!isLocked) return;
      if (syncingRef.current) return;

      const sourceEl = source === "left" ? leftRef.current : rightRef.current;
      const targetEl = source === "left" ? rightRef.current : leftRef.current;
      if (!sourceEl || !targetEl) return;

      syncingRef.current = true;

      const sourceRatio =
        sourceEl.scrollHeight > sourceEl.clientHeight
          ? sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight)
          : 0;

      const maxScroll = targetEl.scrollHeight - targetEl.clientHeight;
      if (maxScroll > 0) {
        targetEl.scrollTop = sourceRatio * maxScroll;
      }

      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    },
    [isLocked],
  );

  // Re-bind listeners when syncScroll changes (i.e. when isLocked changes)
  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    const onLeftScroll = () => syncScroll("left");
    const onRightScroll = () => syncScroll("right");

    leftEl.addEventListener("scroll", onLeftScroll, { passive: true });
    rightEl.addEventListener("scroll", onRightScroll, { passive: true });

    return () => {
      leftEl.removeEventListener("scroll", onLeftScroll);
      rightEl.removeEventListener("scroll", onRightScroll);
    };
  }, [syncScroll]);

  return { leftRef, rightRef, isLocked, toggleLock: () => setIsLocked((v) => !v) };
}
