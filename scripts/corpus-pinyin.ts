/**
 * 批量生成 chinese-sutras-md 可读拼音卷（{经}/拼音/，结构同 原文/、简体/）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { t2s } from "@/lib/han";
import { convertReadableMarkdown } from "@/lib/han/markdown";
import { convertReadableMarkdownToPinyin } from "@/lib/pinyin/markdown";
import type { PinyinScript } from "@/lib/pinyin/types";
import { findSutraMetaFiles, loadSutraMeta, sutraRootFromMetaPath } from "@/lib/corpus-v3/meta";
import { juanSortKey, listJuanMdFiles, parseReadableParagraphs } from "@/lib/corpus-v3/markdown";
import { loadBlocksIndex } from "@/lib/corpus-v3/blocks-index";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();

const cbetaIdFilter = (() => {
  const i = process.argv.indexOf("--cbeta-id");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

const script = ((): PinyinScript => {
  const i = process.argv.indexOf("--script");
  const v = i >= 0 ? process.argv[i + 1] : "traditional";
  return v === "simplified" ? "simplified" : "traditional";
})();

const resume = process.argv.includes("--resume");

function yuanwenDir(sutraRoot: string): string {
  return path.join(sutraRoot, "原文"); // 正文目录名不变
}

function pinyinDir(sutraRoot: string): string {
  return path.join(sutraRoot, "拼音");
}

function processSutra(metaPath: string): { files: number; skipped: number } {
  const meta = loadSutraMeta(metaPath);
  const sutraRoot = sutraRootFromMetaPath(metaPath);
  const srcDir = yuanwenDir(sutraRoot);
  const destDir = pinyinDir(sutraRoot);

  if (!fs.existsSync(srcDir)) return { files: 0, skipped: 0 };

  const yuanwenFiles = listJuanMdFiles(srcDir).sort(
    (a, b) => juanSortKey(path.basename(a)) - juanSortKey(path.basename(b)),
  );
  if (yuanwenFiles.length === 0) return { files: 0, skipped: 0 };

  const blocks = loadBlocksIndex(sutraRoot);
  let files = 0;
  let skipped = 0;

  fs.mkdirSync(destDir, { recursive: true });

  for (const src of yuanwenFiles) {
    const base = path.basename(src);
    const dest = path.join(destDir, base);

    if (resume && fs.existsSync(dest)) {
      skipped += 1;
      continue;
    }

    let md = fs.readFileSync(src, "utf-8");
    if (script === "simplified") {
      md = convertReadableMarkdown(md, (t) => t2s(t, { backend: "js" }).text);
    }

    const out = convertReadableMarkdownToPinyin(md, script);
    fs.writeFileSync(dest, out, "utf-8");

    const srcParas = parseReadableParagraphs(md);
    const dstParas = parseReadableParagraphs(out);
    if (srcParas.length !== dstParas.length) {
      console.warn(
        `WARN ${meta.cbetaId} ${base}: 段落数 ${srcParas.length} → ${dstParas.length}`,
      );
    }

    if (blocks.length > 0 && srcParas.length !== blocks.length) {
      console.warn(
        `WARN ${meta.cbetaId} ${base}: MD 段落 ${srcParas.length} vs blocks ${blocks.length}`,
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
      console.log(
        `${id}: wrote ${files} 拼音 files${skipped ? `, skipped ${skipped}` : ""} (script=${script})`,
      );
    }
    totalFiles += files;
    totalSkipped += skipped;
  }

  console.log(
    `Done: sutras=${metaFiles.length} files=${totalFiles} skipped=${totalSkipped} script=${script}`,
  );
}

main();
