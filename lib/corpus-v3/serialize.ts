/**
 * Corpus V3 可读 Markdown 序列化
 * @author jingxin
 */
import type { StructureBlock, StructureJuan } from "@/lib/cbeta/structure";
import type { SutraMeta } from "./types";

const CN_DIGIT = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

function chineseNumber(n: number): string {
  if (n <= 0) return "零";
  if (n < 10) return CN_DIGIT[n]!;
  if (n < 20) return n === 10 ? "十" : `十${CN_DIGIT[n % 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${CN_DIGIT[tens]!}十${ones === 0 ? "" : CN_DIGIT[ones]}`;
  }
  return String(n);
}

function formatJuanTitle(meta: SutraMeta, juan: StructureJuan): string {
  if (juan.label === "全文") return `# ${meta.title}`;
  return `# ${meta.title} · 第${chineseNumber(juan.juanNum)}卷`;
}

function translatorLine(meta: SutraMeta): string | undefined {
  if (!meta.translator) return undefined;
  if (meta.dynasty && meta.translator.startsWith(meta.dynasty)) {
    return `> ${meta.translator}`;
  }
  const prefix = meta.dynasty ? `${meta.dynasty} ` : "";
  return `> ${prefix}${meta.translator}`.trim();
}

function renderBlocks(blocks: StructureBlock[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (b.sectionTitle) {
      if (lines.length > 0) lines.push("", "---", "");
      lines.push(`## ${b.sectionTitle}`, "");
    }
    if (b.kind === "verse") {
      lines.push(b.text.trim(), "");
    } else {
      lines.push(b.text.trim(), "");
    }
  }
  return lines.join("\n").trimEnd();
}

/** 原文卷 Markdown（无工程字段） */
export function serializeYuanwenJuan(meta: SutraMeta, juan: StructureJuan): string {
  const parts: string[] = [formatJuanTitle(meta, juan)];
  const tl = translatorLine(meta);
  if (tl) parts.push("", tl);
  parts.push("", "---", "");
  const body = renderBlocks(juan.blocks);
  if (body) parts.push(body);
  return parts.join("\n").trimEnd() + "\n";
}

/** 简体卷 Markdown（结构同原文，正文经 convertFn 转换） */
export function serializeJiantiJuan(
  meta: SutraMeta,
  juan: StructureJuan,
  convertFn: (t: string) => string,
): string {
  const jiantiMeta: SutraMeta = { ...meta, title: convertFn(meta.title) };
  const jiantiJuan: StructureJuan = {
    ...juan,
    blocks: juan.blocks.map((b) => ({
      ...b,
      text: convertFn(b.text),
      sectionTitle: b.sectionTitle ? convertFn(b.sectionTitle) : b.sectionTitle,
    })),
  };
  return serializeYuanwenJuan(jiantiMeta, jiantiJuan);
}

/** 白话 / 注释 空模板 */
export function serializeEmptyAuxJuan(
  meta: SutraMeta,
  juan: StructureJuan,
  kind: "白话" | "注释",
): string {
  const suffix = kind === "白话" ? "（白话）" : "（注释）";
  const title =
    juan.label === "全文"
      ? `# ${meta.title}${suffix}`
      : `# ${meta.title}${suffix} · ${juan.label}`;
  const lines = [title, "", "---", ""];
  if (kind === "注释") {
    lines.push("## 注释", "");
  }
  return lines.join("\n").trimEnd() + "\n";
}

export function juanFileBaseName(juan: StructureJuan): string {
  if (juan.label === "全文") return "全文";
  return `第${String(juan.juanNum).padStart(3, "0")}卷`;
}
