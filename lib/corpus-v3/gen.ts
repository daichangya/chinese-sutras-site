/**
 * Corpus V3 生成：XML → 文库式 Markdown 目录
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { t2s } from "@/lib/han";
import { canonDeptFromCbetaId, corpusDirName, dynastyFromTranslator } from "@/lib/cbeta/canon-dept";
import { parseCbetaStructure } from "@/lib/cbeta/structure";
import { writeBlocksIndex } from "./blocks-index";
import { DIR_BAIHUA, DIR_JIANTI_LEGACY, DIR_YUANWEN, DIR_ZHUSHI } from "./corpus-dirs";
import { writeSutraMeta, buleiFieldsForCbetaId, sutraDirName } from "./meta";
import { toSimplifiedLabel } from "./sutra-labels";
import { resolveZwCollisionTitle } from "./zw-title";
import {
  juanFileBaseName,
  serializeEmptyAuxJuan,
  serializeJiantiJuan,
  serializeYuanwenJuan,
} from "./serialize";
import { joinSutraPath } from "./paths";
import type { GeneratedSutraLayout, SutraMeta } from "./types";

export type GenerateCorpusV3Options = {
  cbetaId: string;
  xmlPath: string;
  xmlRoot: string;
  corpusRoot: string;
  stripPreface: boolean;
  cleanStale: boolean;
  /** 来自 resume 索引，避免全 corpus 扫描 */
  knownSutraDir?: string | null;
  /** 生成原文后同步写 简体/ 卷 */
  t2s?: boolean;
  /** t2s 转换 backend，默认 auto */
  t2sBackend?: "auto" | "js" | "cli";
};

function removeDirIfExists(dir: string): void {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

export function generateCorpusV3FromXml(opts: GenerateCorpusV3Options): GeneratedSutraLayout {
  const xml = fs.readFileSync(opts.xmlPath, "utf-8");
  const sourceXmlRel = path.relative(opts.xmlRoot, opts.xmlPath).replace(/\\/g, "/");
  const parsed = parseCbetaStructure(xml, opts.cbetaId, {
    stripPreface: opts.stripPreface,
    sourceXmlRel,
  });

  if (parsed.juans.length === 0 || parsed.juans.every((j) => j.blocks.length === 0)) {
    return { sutraDir: "", metaPath: "", juanFiles: [], blockCount: 0 };
  }

  let titleJian = toSimplifiedLabel(parsed.title) ?? parsed.title;
  const translatorRaw = parsed.translator;
  const translatorJian = toSimplifiedLabel(translatorRaw) ?? translatorRaw;
  const dynastyRaw = parsed.dynasty ?? dynastyFromTranslator(parsed.translator);
  const dynastyJian = toSimplifiedLabel(dynastyRaw) ?? dynastyRaw;

  const dept = canonDeptFromCbetaId(opts.cbetaId, titleJian);
  const deptDir = corpusDirName(dept);

  const xmlRoot = opts.xmlRoot;
  const draftMeta: SutraMeta = {
    cbetaId: parsed.cbetaId,
    title: titleJian,
    category: dept,
    sourceXml: [sourceXmlRel],
  };
  titleJian = resolveZwCollisionTitle(draftMeta, deptDir, opts.corpusRoot, xmlRoot);

  const dirName = sutraDirName(
    titleJian,
    opts.cbetaId,
    opts.corpusRoot,
    deptDir,
    opts.knownSutraDir,
    translatorJian,
    undefined,
    parsed.juanCount,
    dynastyJian,
    parsed.dirDisambiguator,
  );
  const sutraDir = joinSutraPath(opts.corpusRoot, deptDir, dirName);

  if (opts.cleanStale) {
    removeDirIfExists(sutraDir);
  }

  const meta: SutraMeta = {
    cbetaId: parsed.cbetaId,
    title: titleJian,
    translator: translatorJian,
    dynasty: dynastyJian,
    category: dept,
    bulei: buleiFieldsForCbetaId(parsed.cbetaId),
    juanCount: parsed.juanCount,
    sourceXml: [sourceXmlRel],
    description: undefined,
    dirLabel: parsed.dirDisambiguator,
  };

  /** 原文/ 标题行保留 XML 繁体；正文 blocks 本身已是繁体 */
  const yuanwenMeta: SutraMeta = {
    ...meta,
    title: parsed.title,
    translator: translatorRaw,
    dynasty: dynastyRaw,
  };

  const metaPath = path.join(sutraDir, "meta.yaml");
  writeSutraMeta(metaPath, meta);
  writeBlocksIndex(sutraDir, parsed.juans);

  const dirs = [DIR_YUANWEN, DIR_BAIHUA, DIR_ZHUSHI, ...(opts.t2s ? ([DIR_JIANTI_LEGACY] as const) : [])] as const;
  for (const d of dirs) fs.mkdirSync(path.join(sutraDir, d), { recursive: true });

  const convertFn = (text: string) => t2s(text, { backend: opts.t2sBackend ?? "auto" }).text;

  const juanFiles: GeneratedSutraLayout["juanFiles"] = [];
  let blockCount = 0;

  for (const juan of parsed.juans) {
    blockCount += juan.blocks.length;
    const base = juanFileBaseName(juan);
    const fileName = `${base}.md`;
    const yuanwen = path.join(sutraDir, DIR_YUANWEN, fileName);
    const baihua = path.join(sutraDir, DIR_BAIHUA, fileName);
    const zhushi = path.join(sutraDir, DIR_ZHUSHI, fileName);
    const jianti = path.join(sutraDir, DIR_JIANTI_LEGACY, fileName);

    fs.writeFileSync(yuanwen, serializeYuanwenJuan(yuanwenMeta, juan), "utf-8");
    fs.writeFileSync(baihua, serializeEmptyAuxJuan(meta, juan, "白话"), "utf-8");
    fs.writeFileSync(zhushi, serializeEmptyAuxJuan(meta, juan, "注释"), "utf-8");
    if (opts.t2s) {
      fs.writeFileSync(jianti, serializeJiantiJuan(meta, juan, convertFn), "utf-8");
    }

    juanFiles.push({
      juanNum: juan.juanNum,
      label: juan.label,
      yuanwen,
      baihua,
      zhushi,
    });
  }

  return { sutraDir, metaPath, juanFiles, blockCount };
}
