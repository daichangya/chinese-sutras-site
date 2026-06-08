/**
 * Corpus V3 导入对齐：身份侧车 / XML + MD 正文
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { t2s } from "@/lib/han";
import { parseCbetaStructure, normalizeTextForCompare, type StructureJuan } from "@/lib/cbeta/structure";
import { DIR_BAIHUA, DIR_JIANTI_LEGACY, DIR_YUANWEN, DIR_ZHUSHI } from "./corpus-dirs";
import {
  juansFromIndexEntries,
  loadBlocksIndex,
  type BlockIndexEntry,
} from "./blocks-index";
import { findSutraMetaFiles, loadSutraMeta, sutraRootFromMetaPath } from "./meta";
import { juanSortKey, listJuanMdFiles, parseReadableParagraphs, readMdIfExists } from "./markdown";
import { resolveSutraSlug } from "./slug";
import type { ImportChapter } from "./types";
import type { CharReading } from "@/lib/pinyin/types";

export type ImportParagraph = {
  seq: number;
  canonicalId: string;
  startRef: string | null;
  endRef: string | null;
  parserPid: string | null;
  contentHash: string | null;
  juanSeq: number;
  /** 正文简体中文 */
  text: string;
  colloquial: string | null;
  commentary: string | null;
  lecture: string | null;
};

export type ImportSutraBundle = {
  cbetaId: string;
  slug: string;
  title: string;
  translator: string | null;
  category: string | null;
  chapters: ImportChapter[];
  paragraphs: ImportParagraph[];
  warnings: string[];
};

export type AlignOptions = {
  corpusRoot: string;
  xmlRoot: string;
  metaPath: string;
  stripPreface?: boolean;
  /** 仅读 meta + MD + _index，不读 XML */
  mdOnly?: boolean;
};

function resolveXmlPath(meta: ReturnType<typeof loadSutraMeta>, xmlRoot: string): string | null {
  const rel = meta.sourceXml[0];
  if (!rel) return null;
  const abs = path.join(xmlRoot, rel);
  return fs.existsSync(abs) ? abs : null;
}

function sortedMdFiles(dir: string): string[] {
  return listJuanMdFiles(dir).sort((a, b) => juanSortKey(path.basename(a)) - juanSortKey(path.basename(b)));
}

function groupIndexByJuan(entries: BlockIndexEntry[]): Map<number, BlockIndexEntry[]> {
  const byJuan = new Map<number, BlockIndexEntry[]>();
  for (const e of entries) {
    const j = e.juan_num;
    if (!byJuan.has(j)) byJuan.set(j, []);
    byJuan.get(j)!.push(e);
  }
  return byJuan;
}

function juanLabelFromNum(juanNum: number, hasRealJuan: boolean): string {
  if (!hasRealJuan || juanNum <= 0) return "全文";
  const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;
  if (juanNum < 10) return `第${CN[juanNum]}卷`;
  if (juanNum < 20) return juanNum === 10 ? "第十卷" : `第十${CN[juanNum % 10]}卷`;
  return `第${juanNum}卷`;
}

function buildChapters(juans: StructureJuan[]): ImportChapter[] {
  const hasRealJuan = juans.some((j) => j.juanNum > 0);
  return juans.map((j) => ({
    seq: j.juanNum > 0 ? j.juanNum : 0,
    title: j.label || juanLabelFromNum(j.juanNum, hasRealJuan),
  }));
}

function alignJuanParagraphs(
  metaCbetaId: string,
  juan: StructureJuan,
  indexEntries: BlockIndexEntry[],
  yuanwenMd: string | null,
  baihuaMd: string | null,
  zhushiMd: string | null,
  xmlBlocks: StructureJuan["blocks"] | null,
  warnings: string[],
  startSeq: number,
): { paragraphs: ImportParagraph[]; nextSeq: number } {
  const mdParagraphs = yuanwenMd ? parseReadableParagraphs(yuanwenMd) : [];
  const colloquials = baihuaMd ? parseReadableParagraphs(baihuaMd) : [];
  const commentaries = zhushiMd ? parseReadableParagraphs(zhushiMd) : [];
  const juanSeq = juan.juanNum > 0 ? juan.juanNum : 0;

  const identityCount = indexEntries.length > 0 ? indexEntries.length : (xmlBlocks?.length ?? 0);
  if (mdParagraphs.length > 0 && mdParagraphs.length !== identityCount) {
    warnings.push(
      `${metaCbetaId} ${juan.label}: MD 段落 ${mdParagraphs.length} vs 索引 ${identityCount}`,
    );
  }

  const paragraphs: ImportParagraph[] = [];
  let seq = startSeq;
  const count = Math.max(identityCount, mdParagraphs.length);

  for (let j = 0; j < count; j++) {
    const idxEntry = indexEntries[j];
    const xmlBlock = xmlBlocks?.[j];
    const mdText = mdParagraphs[j];

    const canonicalId = idxEntry?.canonical_id ?? xmlBlock?.canonicalId;
    if (!canonicalId) continue;

    const xmlText = xmlBlock?.text ?? "";
    const text = mdText ?? xmlText;

    // text 始终存简体：原文 MD 是繁体 → t2s；如果 MD 缺失则 XML 原文（繁体）→ t2s
    const textSimplified = text ? t2s(text, { backend: "js" }).text : "";

    if (mdText && xmlText && normalizeTextForCompare(mdText) !== normalizeTextForCompare(xmlText)) {
      warnings.push(`${metaCbetaId} ${canonicalId}: MD 正文与 XML 不一致（采用 MD）`);
    } else if (
      mdText &&
      idxEntry?.content_hash &&
      xmlBlock?.contentHash &&
      idxEntry.content_hash !== xmlBlock.contentHash
    ) {
      warnings.push(`${metaCbetaId} ${canonicalId}: _index 与 XML content_hash 不一致`);
    }

    seq += 1;
    paragraphs.push({
      seq,
      canonicalId,
      startRef: idxEntry?.start_ref ?? xmlBlock?.startRef ?? null,
      endRef: idxEntry?.end_ref ?? xmlBlock?.endRef ?? null,
      parserPid: idxEntry?.parser_pid ?? xmlBlock?.parserPid ?? null,
      contentHash: idxEntry?.content_hash ?? xmlBlock?.contentHash ?? null,
      juanSeq,
      text: textSimplified,
      colloquial: colloquials[j]?.trim() || null,
      commentary: commentaries[j]?.trim() || null,
      lecture: null,
    });
  }

  return { paragraphs, nextSeq: seq };
}

export function buildImportBundle(opts: AlignOptions): ImportSutraBundle {
  const meta = loadSutraMeta(opts.metaPath);
  const sutraRoot = sutraRootFromMetaPath(opts.metaPath);
  const slug = resolveSutraSlug(meta);
  const warnings: string[] = [];

  const indexEntries = loadBlocksIndex(sutraRoot);
  let structureJuans: StructureJuan[];
  let xmlJuans: StructureJuan[] | null = null;

  if (opts.mdOnly) {
    if (indexEntries.length === 0) {
      throw new Error(`${meta.cbetaId}: missing _index/blocks.jsonl (required for --md-only)`);
    }
    structureJuans = juansFromIndexEntries(indexEntries);
  } else {
    const xmlPath = resolveXmlPath(meta, opts.xmlRoot);
    if (xmlPath) {
      const xml = fs.readFileSync(xmlPath, "utf-8");
      const structure = parseCbetaStructure(xml, meta.cbetaId, {
        stripPreface: opts.stripPreface ?? true,
        sourceXmlRel: meta.sourceXml[0],
      });
      xmlJuans = structure.juans;
      if (indexEntries.length > 0) {
        structureJuans = juansFromIndexEntries(indexEntries);
        const xmlBlockCount = xmlJuans.reduce((s, j) => s + j.blocks.length, 0);
        if (indexEntries.length !== xmlBlockCount) {
          warnings.push(
            `${meta.cbetaId}: _index 块数 ${indexEntries.length} vs XML ${xmlBlockCount}，以 _index 为准对齐 MD`,
          );
        }
      } else {
        structureJuans = xmlJuans;
        warnings.push(`${meta.cbetaId}: 无 _index/blocks.jsonl，身份来自 XML`);
      }
    } else if (indexEntries.length > 0) {
      structureJuans = juansFromIndexEntries(indexEntries);
      warnings.push(`${meta.cbetaId}: XML 不可用，身份来自 _index`);
    } else {
      throw new Error(`${meta.cbetaId}: 需要 XML 或 _index/blocks.jsonl`);
    }
  }

  const chapters = buildChapters(structureJuans);
  const indexByJuan = groupIndexByJuan(indexEntries);
  const yuanwenFiles = sortedMdFiles(path.join(sutraRoot, DIR_YUANWEN));
  const baihuaFiles = sortedMdFiles(path.join(sutraRoot, DIR_BAIHUA));
  const zhushiFiles = sortedMdFiles(path.join(sutraRoot, DIR_ZHUSHI));

  const sortedJuans = [...structureJuans].sort((a, b) => {
    const ak = a.juanNum > 0 ? a.juanNum : 0;
    const bk = b.juanNum > 0 ? b.juanNum : 0;
    return ak - bk;
  });

  if (yuanwenFiles.length !== sortedJuans.length) {
    warnings.push(
      `${meta.cbetaId}: 原文卷数 ${yuanwenFiles.length} vs 索引卷数 ${sortedJuans.length}`,
    );
  }

  const paragraphs: ImportParagraph[] = [];
  let globalSeq = 0;

  for (let i = 0; i < sortedJuans.length; i++) {
    const juan = sortedJuans[i]!;
    const juanNum = juan.juanNum > 0 ? juan.juanNum : 0;
    const juanIndex = indexByJuan.get(juanNum) ?? juan.blocks.map((b) => ({
      canonical_id: b.canonicalId,
      start_ref: b.startRef ?? null,
      end_ref: b.endRef ?? null,
      content_hash: b.contentHash,
      parser_pid: b.parserPid,
      juan_num: juanNum,
      kind: b.kind,
    }));

    const xmlJuan = xmlJuans?.find((x) => (x.juanNum > 0 ? x.juanNum : 0) === juanNum);

    const result = alignJuanParagraphs(
      meta.cbetaId,
      juan,
      juanIndex,
      yuanwenFiles[i] ? readMdIfExists(yuanwenFiles[i]!) : null,
      baihuaFiles[i] ? readMdIfExists(baihuaFiles[i]!) : null,
      zhushiFiles[i] ? readMdIfExists(zhushiFiles[i]!) : null,
      xmlJuan?.blocks ?? null,
      warnings,
      globalSeq,
    );
    paragraphs.push(...result.paragraphs);
    globalSeq = result.nextSeq;
  }

  return {
    cbetaId: meta.cbetaId,
    slug,
    title: meta.title,
    translator: meta.translator ?? null,
    category: meta.category,
    chapters,
    paragraphs,
    warnings,
  };
}

export type FindBundlesOptions = {
  corpusRoot: string;
  xmlRoot: string;
  mdOnly?: boolean;
  stripPreface?: boolean;
};

export function findAllImportBundles(opts: FindBundlesOptions): ImportSutraBundle[] {
  return findSutraMetaFiles(opts.corpusRoot).map((metaPath) =>
    buildImportBundle({
      corpusRoot: opts.corpusRoot,
      xmlRoot: opts.xmlRoot,
      metaPath,
      stripPreface: opts.stripPreface ?? true,
      mdOnly: opts.mdOnly,
    }),
  );
}
