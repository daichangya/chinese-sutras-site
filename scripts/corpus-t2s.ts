/**
 * 批量将 corpus 原文转为简体 Markdown
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { t2s, type ConvertBackend } from "@/lib/han";
import { convertReadableMarkdown } from "@/lib/han/markdown";
import { DIR_JIANTI_LEGACY, DIR_YUANWEN } from "@/lib/corpus-v3/corpus-dirs";
import { findSutraMetaFiles, loadSutraMeta, sutraRootFromMetaPath } from "@/lib/corpus-v3/meta";
import { listJuanMdFiles, parseReadableParagraphs } from "@/lib/corpus-v3/markdown";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();

const cbetaIdFilter = (() => {
  const i = process.argv.indexOf("--cbeta-id");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

const backend = (() => {
  const i = process.argv.indexOf("--backend");
  const v = i >= 0 ? process.argv[i + 1] : "auto";
  return (v ?? "auto") as ConvertBackend;
})();

const resume = process.argv.includes("--resume");

function convertFn(text: string): string {
  return t2s(text, { backend }).text;
}

function processSutra(metaPath: string): { files: number; skipped: number } {
  const meta = loadSutraMeta(metaPath);
  const sutraRoot = sutraRootFromMetaPath(metaPath);
  const yuanwenDir = path.join(sutraRoot, DIR_YUANWEN);
  const jiantiDir = path.join(sutraRoot, DIR_JIANTI_LEGACY);

  if (!fs.existsSync(yuanwenDir)) return { files: 0, skipped: 0 };

  const yuanwenFiles = listJuanMdFiles(yuanwenDir);
  if (yuanwenFiles.length === 0) return { files: 0, skipped: 0 };

  let files = 0;
  let skipped = 0;

  fs.mkdirSync(jiantiDir, { recursive: true });

  for (const src of yuanwenFiles) {
    const base = path.basename(src);
    const dest = path.join(jiantiDir, base);

    if (resume && fs.existsSync(dest)) {
      skipped += 1;
      continue;
    }

    const md = fs.readFileSync(src, "utf-8");
    const out = convertReadableMarkdown(md, convertFn);
    fs.writeFileSync(dest, out, "utf-8");

    const srcParas = parseReadableParagraphs(md);
    const dstParas = parseReadableParagraphs(out);
    if (srcParas.length !== dstParas.length) {
      console.warn(
        `WARN ${meta.cbetaId} ${base}: 段落数 ${srcParas.length} → ${dstParas.length}`,
      );
    }

    files += 1;
  }

  return { files, skipped };
}

function main(): void {
  let metaFiles = findSutraMetaFiles(corpusRoot);
  if (cbetaIdFilter) {
    metaFiles = metaFiles.filter((p) => {
      try {
        return loadSutraMeta(p).cbetaId === cbetaIdFilter;
      } catch {
        return false;
      }
    });
  }

  let totalFiles = 0;
  let totalSkipped = 0;

  for (const metaPath of metaFiles) {
    const { files, skipped } = processSutra(metaPath);
    if (files > 0) {
      const id = loadSutraMeta(metaPath).cbetaId;
      console.log(`${id}: wrote ${files} 简体 files${skipped ? `, skipped ${skipped}` : ""}`);
    }
    totalFiles += files;
    totalSkipped += skipped;
  }

  console.log(
    `Done: sutras=${metaFiles.length} files=${totalFiles} skipped=${totalSkipped} backend=${backend}`,
  );
}

main();
