/**
 * 佛教节日数据（YAML）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import type { FestivalEntry, FestivalTier } from "./types";
import type { LunarInfo } from "./types";

let cachedFestivals: FestivalEntry[] | null = null;

function festivalsPath(): string {
  return path.join(process.cwd(), "data/buddhist-calendar/festivals.yaml");
}

function validateEntry(raw: unknown, index: number): FestivalEntry {
  if (!raw || typeof raw !== "object") {
    throw new Error(`festivals.yaml[${index}]: invalid entry`);
  }
  const e = raw as Record<string, unknown>;
  const tier = e.tier as FestivalTier;
  if (tier === "major" && (!e.aiTheme || !Array.isArray(e.searchHints) || e.searchHints.length === 0)) {
    throw new Error(`festivals.yaml[${index}] ${e.id}: major festival requires aiTheme and searchHints`);
  }
  return {
    id: String(e.id),
    name: String(e.name),
    lunarMonth: Number(e.lunarMonth),
    lunarDay: Number(e.lunarDay),
    tier,
    aiTheme: e.aiTheme ? String(e.aiTheme) : undefined,
    searchHints: Array.isArray(e.searchHints) ? e.searchHints.map(String) : undefined,
    relatedSutras: Array.isArray(e.relatedSutras) ? e.relatedSutras.map(String) : undefined,
    verseOverride: e.verseOverride as FestivalEntry["verseOverride"],
  };
}

export function loadFestivals(): FestivalEntry[] {
  if (cachedFestivals) return cachedFestivals;
  const file = festivalsPath();
  const text = fs.readFileSync(file, "utf8");
  const parsed = YAML.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("festivals.yaml must be an array");
  }
  cachedFestivals = parsed.map(validateEntry);
  return cachedFestivals;
}

/** 测试用：重置缓存 */
export function resetFestivalsCache(): void {
  cachedFestivals = null;
}

export function findFestivalsForLunar(lunar: Pick<LunarInfo, "month" | "day">): FestivalEntry[] {
  return loadFestivals().filter((f) => f.lunarMonth === lunar.month && f.lunarDay === lunar.day);
}

export function findMajorFestivalForLunar(lunar: Pick<LunarInfo, "month" | "day">): FestivalEntry | null {
  return findFestivalsForLunar(lunar).find((f) => f.tier === "major") ?? null;
}

export function findFestivalById(id: string): FestivalEntry | null {
  return loadFestivals().find((f) => f.id === id) ?? null;
}
