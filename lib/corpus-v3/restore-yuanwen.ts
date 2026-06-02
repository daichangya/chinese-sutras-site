/**
 * 从 CBETA XML 仅恢复经目 原文/ 卷与 _index（不触碰白话/注释/meta）
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { resolveCbetaXmlPath } from "@/lib/cbeta/resolve-path";
import { parseCbetaStructure } from "@/lib/cbeta/structure";
import { writeBlocksIndex } from "./blocks-index";
import { DIR_YUANWEN } from "./corpus-dirs";
import { loadSutraMeta } from "./meta";
import { juanFileBaseName, serializeYuanwenJuan } from "./serialize";
import type { SutraMeta } from "./types";

export type RestoreYuanwenStatus = "ok" | "skipped_no_xml" | "skipped_empty";

export type RestoreYuanwenResult = {
  status: RestoreYuanwenStatus;
  cbetaId: string;
  juanCount: number;
  blockCount: number;
};

export type RestoreYuanwenOptions = {
  metaPath: string;
  corpusRoot: string;
  xmlRoot: string;
  stripPreface?: boolean;
  dryRun?: boolean;
};

function resolveXmlForMeta(
  meta: SutraMeta,
  xmlRoot: string,
): { xmlPath: string; sourceXmlRel: string } | null {
  const rels = meta.sourceXml ?? [];
  for (const rel of rels) {
    const abs = path.isAbsolute(rel) ? rel : path.join(xmlRoot, rel);
    if (fs.existsSync(abs)) {
      return { xmlPath: abs, sourceXmlRel: path.relative(xmlRoot, abs).replace(/\\/g, "/") };
    }
  }
  const fromId = resolveCbetaXmlPath(meta.cbetaId, xmlRoot);
  if (fromId) {
    return { xmlPath: fromId, sourceXmlRel: path.relative(xmlRoot, fromId).replace(/\\/g, "/") };
  }
  return null;
}

export function restoreYuanwenFromXml(opts: RestoreYuanwenOptions): RestoreYuanwenResult {
  const meta = loadSutraMeta(opts.metaPath);
  const sutraRoot = path.dirname(opts.metaPath);
  const empty: RestoreYuanwenResult = {
    status: "skipped_empty",
    cbetaId: meta.cbetaId,
    juanCount: 0,
    blockCount: 0,
  };

  const resolved = resolveXmlForMeta(meta, opts.xmlRoot);
  if (!resolved) {
    return { ...empty, status: "skipped_no_xml" };
  }

  const xml = fs.readFileSync(resolved.xmlPath, "utf-8");
  const parsed = parseCbetaStructure(xml, meta.cbetaId, {
    stripPreface: opts.stripPreface ?? true,
    sourceXmlRel: resolved.sourceXmlRel,
  });

  if (parsed.juans.length === 0 || parsed.juans.every((j) => j.blocks.length === 0)) {
    return empty;
  }

  const writeMeta: SutraMeta = {
    ...meta,
    title: parsed.title,
    translator: parsed.translator ?? meta.translator,
    dynasty: parsed.dynasty ?? meta.dynasty,
    juanCount: parsed.juanCount ?? meta.juanCount,
  };

  let blockCount = 0;
  if (!opts.dryRun) {
    const yuanwenDir = path.join(sutraRoot, DIR_YUANWEN);
    fs.mkdirSync(yuanwenDir, { recursive: true });
    for (const juan of parsed.juans) {
      blockCount += juan.blocks.length;
      const fileName = `${juanFileBaseName(juan)}.md`;
      fs.writeFileSync(
        path.join(yuanwenDir, fileName),
        serializeYuanwenJuan(writeMeta, juan),
        "utf-8",
      );
    }
    writeBlocksIndex(sutraRoot, parsed.juans);
  } else {
    for (const juan of parsed.juans) blockCount += juan.blocks.length;
  }

  return {
    status: "ok",
    cbetaId: meta.cbetaId,
    juanCount: parsed.juans.length,
    blockCount,
  };
}
