/**
 * 佛历月历页
 * @author 代长亚
 */
import { BuddhistCalendar } from "@/components/calendar/buddhist-calendar";
import { PageShell } from "@/components/ui/page-shell";
import { brandPageTitleSuffix } from "@/lib/brand";
import { listImportedFestivalSutraSlugs } from "@/lib/calendar/festival-sutras";
import { resolveCalendarMonth } from "@/lib/calendar/resolve-day";
import { getCalendarTodayKey, parseIsoDate } from "@/lib/calendar/today";
import { getSqlite } from "@/lib/db";

export const metadata = {
  title: `佛历 | ${brandPageTitleSuffix()}`,
  description: "汉传佛历月历：农历、佛历纪年、六斋十斋日与佛教节日",
};

function normalizeYearMonth(searchParams: { year?: string; month?: string }) {
  const today = getCalendarTodayKey();
  const [ty, tm] = today.split("-").map(Number);
  const year = Number(searchParams.year) || ty!;
  const month = Number(searchParams.month) || tm!;
  const safeYear = year >= 1900 && year <= 2100 ? year : ty!;
  const safeMonth = month >= 1 && month <= 12 ? month : tm!;
  return { year: safeYear, month: safeMonth };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const { year, month } = normalizeYearMonth(sp);
  getSqlite();
  const days = resolveCalendarMonth(year, month);
  const importedSutraSlugs = listImportedFestivalSutraSlugs();
  const firstIso = `${year}-${String(month).padStart(2, "0")}-01`;
  const leadingBlanks = parseIsoDate(firstIso).getUTCDay();

  return (
    <PageShell className="py-10">
      <BuddhistCalendar
        year={year}
        month={month}
        days={days}
        leadingBlanks={leadingBlanks}
        importedSutraSlugs={importedSutraSlugs}
      />
    </PageShell>
  );
}
