/**
 * 佛历类型定义
 * @author 代长亚
 */

export type FestivalTier = "major" | "minor";

export type VerseOverride = {
  customText?: string;
  sutraSlug?: string;
  paragraphId?: string;
};

export type FestivalEntry = {
  id: string;
  name: string;
  lunarMonth: number;
  lunarDay: number;
  tier: FestivalTier;
  aiTheme?: string;
  searchHints?: string[];
  relatedSutras?: string[];
  verseOverride?: VerseOverride;
};

export type FastingMode = "six" | "ten";

export type LunarInfo = {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  monthLabel: string;
  dayLabel: string;
  label: string;
};

export type CalendarDay = {
  isoDate: string;
  gregorianYear: number;
  gregorianMonth: number;
  gregorianDay: number;
  buddhistYear: number;
  lunar: LunarInfo;
  festivals: FestivalEntry[];
  isSixFastingDay: boolean;
  isTenFastingDay: boolean;
};

export type DailyVerseSource =
  | "daily_verse"
  | "festival_curated"
  | "festival_ai_cached"
  | "festival_fallback";

export type ResolvedDailyVerse = {
  source: DailyVerseSource;
  verseText: string;
  verseSource: string;
  paragraphId: string | null;
  aiSummary: string | null;
  festival: FestivalEntry | null;
  needsAiRefresh: boolean;
  aiRecommended: boolean;
};
