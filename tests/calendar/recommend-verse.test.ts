/**
 * 节日经句推荐查询拼装
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { loadFestivals } from "@/lib/calendar/festivals";
import { getFestivalVerseFallback } from "@/lib/calendar/daily-verse";

describe("festival verse fallback", () => {
  it("returns default verse when no related sutra in db", () => {
    const festival = loadFestivals().find((f) => f.id === "buddha-birthday")!;
    const fb = getFestivalVerseFallback(festival);
    expect(fb.verseText.length).toBeGreaterThan(0);
  });
});
