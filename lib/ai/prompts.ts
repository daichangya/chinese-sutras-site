/**
 * AI Prompt 模板
 * @author 代长亚
 */
export const AI_DISCLAIMER =
  "以上内容由 AI 辅助生成，仅供学习参考，不能替代法师开示与权威注疏。若遇疑难，请向合格善知识请教。";

export type ExplainTab = "modern" | "background" | "life";

export function buildExplainPrompt(
  tab: ExplainTab,
  selection: string,
  context: { sutraTitle: string; before: string; after: string },
): { system: string; user: string } {
  const base = `你正在帮助用户阅读佛经《${context.sutraTitle}》。必须依据所给经文上下文解释，不得虚构经名、卷号或历史事件。若经内未提及，请明确说明。`;

  const tabInstruction: Record<ExplainTab, string> = {
    modern: "用现代汉语简明解释所选文句的含义，避免玄学套话，200字以内。",
    background: "说明该文句在经文语境中的背景；若无法从上下文推断历史背景，请如实说明。150字以内。",
    life: "结合当代日常生活举一个贴近现实的理解案例，不宣扬迷信，150字以内。",
  };

  return {
    system: `${base}\n${tabInstruction[tab]}`,
    user: `所选文句：${selection}\n\n前文：${context.before}\n\n后文：${context.after}`,
  };
}

import { brandAiSystemRole } from "@/lib/brand";

export function buildDailySummaryPrompt(verseText: string, sutraTitle: string, festivalTheme?: string) {
  const themeHint = festivalTheme ? `今日主题：${festivalTheme}。` : "";
  return {
    system: `${brandAiSystemRole()}${themeHint}用温暖、简洁的现代汉语写一段今日经句解读，80-120字，可供分享。不要虚构出处。`,
    user: `经名：${sutraTitle}\n经句：${verseText}`,
  };
}

export function buildFestivalVerseSelectPrompt(festivalName: string, aiTheme: string, ragContext: string) {
  return {
    system: `${brandAiSystemRole()}你从经藏候选段落中，为「${festivalName}」选取最贴切的一段经文摘录（不超过80字）。必须只选候选中的真实经文，禁止虚构经名。回复格式：先写 [序号]，再可选 JSON {"paragraphId":"...","excerpt":"...","sutraTitle":"..."}。`,
    user: `节日主题：${aiTheme}\n\n候选经文：\n${ragContext || "（无候选，请回复 [1] 并说明无法选取）"}`,
  };
}
