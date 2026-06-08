/**
 * 从 CBETA XML / 语料原文补全 meta
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { dynastyFromTranslator } from "@/lib/cbeta/canon-dept";
import { parseCbetaStructure } from "@/lib/cbeta/structure";
import { extractDirDisambiguatorFromXml, cbetaVariantLetter } from "./dir-disambiguator";
import type { SutraMeta } from "./types";

const DEFAULT_XML_ROOT = path.join(process.cwd(), "vendor/xml-p5");

type ParsedHeader = {
  translator?: string;
  juanCount?: number;
  dirLabel?: string;
};

function parseHeaderFromSourceXml(
  cbetaId: string,
  sourceXml: string[],
  xmlRoot: string,
): ParsedHeader | undefined {
  for (const rel of sourceXml) {
    const abs = path.isAbsolute(rel) ? rel : path.join(xmlRoot, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const xml = fs.readFileSync(abs, "utf-8");
      const parsed = parseCbetaStructure(xml, cbetaId, { stripPreface: false, sourceXmlRel: rel });
      return {
        translator: parsed.translator,
        juanCount: parsed.juanCount,
        dirLabel: parsed.dirDisambiguator,
      };
    } catch {
      continue;
    }
  }
  return undefined;
}

function dirLabelFromSourceXml(sourceXml: string[], xmlRoot: string): string | undefined {
  for (const rel of sourceXml) {
    const abs = path.isAbsolute(rel) ? rel : path.join(xmlRoot, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const xml = fs.readFileSync(abs, "utf-8");
      const label = extractDirDisambiguatorFromXml(xml);
      if (label) return label;
    } catch {
      continue;
    }
  }
  return undefined;
}

/** 统计 原文/ 下卷文件数 */
export function juanCountFromYuanwenDir(sutraDir: string): number | undefined {
  const yuanwen = path.join(sutraDir, "原文"); // 目录名 原文 繁简同形
  if (!fs.existsSync(yuanwen)) return undefined;
  const n = fs
    .readdirSync(yuanwen)
    .filter((f) => f.endsWith(".md") && !f.startsWith(".")).length;
  return n > 0 ? n : undefined;
}

/** 补全译者、卷数、目录消歧标签（不改变已有字段） */
export function enrichMetaFromXml(
  meta: SutraMeta,
  metaPath?: string,
  xmlRoot = process.env.CBETA_XML_ROOT ?? DEFAULT_XML_ROOT,
): SutraMeta {
  let translator = meta.translator;
  let juanCount = meta.juanCount;
  let dynasty = meta.dynasty;
  let dirLabel = meta.dirLabel;

  if ((!translator?.trim() || juanCount == null) && meta.sourceXml?.length) {
    const header = parseHeaderFromSourceXml(meta.cbetaId, meta.sourceXml, xmlRoot);
    if (header) {
      if (!translator?.trim() && header.translator?.trim()) {
        translator = header.translator.trim();
        dynasty = dynasty ?? dynastyFromTranslator(translator);
      }
      if (juanCount == null && header.juanCount != null && header.juanCount > 0) {
        juanCount = header.juanCount;
      }
      if (!dirLabel?.trim() && header.dirLabel?.trim()) {
        dirLabel = header.dirLabel.trim();
      }
    }
  }

  /** 变体经号：从 XML 提取/刷新 dir_label（卷号 > 会名 > 录文） */
  if (meta.sourceXml?.length && cbetaVariantLetter(meta.cbetaId)) {
    dirLabel = dirLabelFromSourceXml(meta.sourceXml, xmlRoot) ?? dirLabel;
  }

  if (juanCount == null && metaPath) {
    juanCount = juanCountFromYuanwenDir(path.dirname(metaPath));
  }

  if (
    translator === meta.translator &&
    juanCount === meta.juanCount &&
    dynasty === meta.dynasty &&
    dirLabel === meta.dirLabel
  ) {
    return meta;
  }

  return {
    ...meta,
    translator,
    dynasty,
    juanCount,
    dirLabel,
  };
}

/** @deprecated 使用 enrichMetaFromXml */
export function enrichTranslatorFromXml(
  meta: SutraMeta,
  xmlRoot = process.env.CBETA_XML_ROOT ?? DEFAULT_XML_ROOT,
): SutraMeta {
  return enrichMetaFromXml(meta, undefined, xmlRoot);
}

export function translatorFromSourceXml(
  cbetaId: string,
  sourceXml: string[],
  xmlRoot = process.env.CBETA_XML_ROOT ?? DEFAULT_XML_ROOT,
): string | undefined {
  return parseHeaderFromSourceXml(cbetaId, sourceXml, xmlRoot)?.translator;
}
