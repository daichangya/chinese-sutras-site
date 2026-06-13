/**
 * 节日 YAML
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  findFestivalsForLunar,
  findMajorFestivalForLunar,
  loadFestivals,
} from "@/lib/calendar/festivals";

describe("buddhist festivals", () => {
  it("loads festival list", () => {
    const list = loadFestivals();
    expect(list.length).toBeGreaterThan(10);
    expect(list.some((f) => f.id === "buddha-birthday")).toBe(true);
  });

  it("matches lunar month/day", () => {
    const major = findMajorFestivalForLunar({ month: 4, day: 8 });
    expect(major?.id).toBe("buddha-birthday");
    const all = findFestivalsForLunar({ month: 2, day: 19 });
    expect(all.some((f) => f.id === "guanyin-birthday")).toBe(true);
  });

  it("requires major festivals to have ai hints", () => {
    for (const f of loadFestivals().filter((x) => x.tier === "major")) {
      expect(f.aiTheme?.length).toBeGreaterThan(0);
      expect(f.searchHints?.length).toBeGreaterThan(0);
    }
  });
});
