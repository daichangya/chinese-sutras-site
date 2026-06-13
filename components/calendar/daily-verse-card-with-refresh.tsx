"use client";

/**
 * 节日经句 AI 懒刷新包装
 * @author 代长亚
 */
import { useEffect, useState } from "react";
import { DailyVerseCard } from "@/components/home/daily-verse-card";
import type { CalendarDay, ResolvedDailyVerse } from "@/lib/calendar/types";

export function DailyVerseCardWithRefresh({
  initial,
  calendarDay,
  verseDate,
}: {
  initial: ResolvedDailyVerse;
  calendarDay: CalendarDay;
  verseDate: string;
}) {
  const [resolved, setResolved] = useState(initial);

  useEffect(() => {
    if (!initial.needsAiRefresh || !initial.festival) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verseDate,
            festivalId: initial.festival!.id,
            verseText: initial.verseText,
            sutraTitle: initial.verseSource,
          }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          summary?: string;
          verseText?: string;
          verseSource?: string;
        };
        setResolved((prev) => ({
          ...prev,
          needsAiRefresh: false,
          aiRecommended: true,
          source: "festival_ai_cached",
          verseText: data.verseText ?? prev.verseText,
          verseSource: data.verseSource ?? prev.verseSource,
          aiSummary: data.summary ?? prev.aiSummary,
        }));
      } catch {
        /* keep fallback */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initial, verseDate]);

  const label = resolved.festival
    ? `${resolved.festival.name} · 今日经句`
    : "今日经句";

  return (
    <DailyVerseCard
      label={label}
      calendarDay={calendarDay}
      verseText={resolved.verseText}
      verseSource={resolved.verseSource}
      aiSummary={resolved.aiSummary}
      aiRecommended={resolved.aiRecommended}
      pendingAi={resolved.needsAiRefresh}
    />
  );
}
