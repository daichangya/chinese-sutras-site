/**
 * 合并「无 meta 的内容目录」到同 cbeta_id 的 canonical 目录
 * @author 代长亚
 *
 * 用法:
 *   npm run corpus:merge-orphans -- --dry-run
 *   npm run corpus:merge-orphans -- --only 大明三藏法数
 */
import fs from "fs";
import path from "path";
import { DIR_JIANTI_LEGACY } from "@/lib/corpus-v3/corpus-dirs";
import { isMetaOnlySutraDir, mergeDirInto } from "@/lib/corpus-v3/dir-merge";
import { findSutraMetaFiles, readCbetaIdFromMetaFile } from "@/lib/corpus-v3/meta";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const dryRun = process.argv.includes("--dry-run");
const onlyFilter = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

function readCbetaIdFromBlocks(sutraRoot: string): string | null {
  const blocks = path.join(sutraRoot, "_index", "blocks.jsonl");
  if (!fs.existsSync(blocks)) return null;
  const first = fs
    .readFileSync(blocks, "utf-8")
    .split("\n")
    .find((l) => l.trim());
  if (!first) return null;
  const m = first.match(/"canonical_id"\s*:\s*"([^:]+):/);
  return m ? m[1]!.trim() : null;
}

function collectSutraDirs(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const hasMeta = fs.existsSync(path.join(dir, "meta.yaml"));
    const hasContent =
      fs.existsSync(path.join(dir, "_index")) ||
      fs.existsSync(path.join(dir, "原文")) ||
      fs.existsSync(path.join(dir, "白话"));
    if (hasMeta || hasContent) out.push(dir);
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isDirectory() && !ent.name.startsWith(".")) walk(path.join(dir, ent.name));
    }
  };
  walk(root);
  return out;
}

function main(): void {
  const canonicalByCbeta = new Map<string, string>();
  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const id = readCbetaIdFromMetaFile(metaPath);
    if (!id) continue;
    const dir = path.dirname(metaPath);
    const rel = path.relative(corpusRoot, dir).replace(/\\/g, "/");
    canonicalByCbeta.set(id.toUpperCase(), dir);
  }

  let merged = 0;
  let removedJianti = 0;

  for (const dir of collectSutraDirs(corpusRoot)) {
    const rel = path.relative(corpusRoot, dir).replace(/\\/g, "/");
    if (onlyFilter && !rel.includes(onlyFilter)) continue;

    const hasMeta = fs.existsSync(path.join(dir, "meta.yaml"));
    if (hasMeta) continue;

    const cbetaId = readCbetaIdFromBlocks(dir);
    if (!cbetaId) continue;

    const canonical = canonicalByCbeta.get(cbetaId.toUpperCase());
    if (!canonical || path.resolve(canonical) === path.resolve(dir)) continue;

    const canonRel = path.relative(corpusRoot, canonical).replace(/\\/g, "/");
    console.log(`${dryRun ? "[dry-run] " : ""}merge ${rel} -> ${canonRel} (${cbetaId})`);
    if (!dryRun) {
      mergeDirInto(dir, canonical);
      const jianti = path.join(canonical, DIR_JIANTI_LEGACY);
      if (fs.existsSync(jianti)) {
        fs.rmSync(jianti, { recursive: true, force: true });
        removedJianti += 1;
      }
    }
    merged += 1;
  }

  // meta-only 空壳若同 cbeta 已有完整目录，可删（canonical 侧）
  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const dir = path.dirname(metaPath);
    const rel = path.relative(corpusRoot, dir).replace(/\\/g, "/");
    if (onlyFilter && !rel.includes(onlyFilter)) continue;
    if (!isMetaOnlySutraDir(dir)) continue;
    const id = readCbetaIdFromMetaFile(metaPath);
    if (!id) continue;
    // 若刚合并完，此目录应已有内容；仍为空则保留 meta 供 gen
    if (!isMetaOnlySutraDir(dir)) continue;
  }

  console.log(`Done: merged=${merged} removedJianti=${removedJianti} dryRun=${dryRun}`);
}

main();
