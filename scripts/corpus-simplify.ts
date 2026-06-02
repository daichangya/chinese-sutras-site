/**
 * 语料库目录名 + 白话/注释/meta 转简体（不修改 原文/；简体正文请用 corpus:t2s）
 * @author jingxin
 *
 * 用法:
 *   npm run corpus:simplify                    # 全量
 *   npm run corpus:simplify -- --md-only       # 只转 MD/meta
 *   npm run corpus:simplify -- --dirs-only     # 只重命名目录
 *   npm run corpus:simplify -- --workers 8     # 8 进程并行转 MD
 *   npm run corpus:simplify -- --only 百喻经
 *   npm run corpus:simplify -- --dept 新编 --workers 8
 *   npm run corpus:simplify -- --merge-jianti-into-yuanwen  # 废弃：删除 简体/（默认保留）
 */
import { spawn } from "node:child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { t2sBatch } from "@/lib/han";
import { corpusDirName } from "@/lib/cbeta/corpus-category";
import { DIR_JIANTI_LEGACY, LEGACY_SUBDIR_RENAMES } from "@/lib/corpus-v3/corpus-dirs";
import { collectSimplifyMdFiles } from "@/lib/corpus-v3/simplify-md";
import {
  findSutraMetaFiles,
  loadSutraMeta,
  writeSutraMeta,
  type SutraMeta,
} from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const dryRun = process.argv.includes("--dry-run");
const mdOnly = process.argv.includes("--md-only");
const dirsOnly = process.argv.includes("--dirs-only");
const quiet = process.argv.includes("--quiet");
const mergeJiantiIntoYuanwen = process.argv.includes("--merge-jianti-into-yuanwen");

const onlyFilter = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

const deptFilter = (() => {
  const i = process.argv.indexOf("--dept");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

function argMatchesPath(absPath: string): boolean {
  const rel = path.relative(corpusRoot, absPath).replace(/\\/g, "/");
  if (onlyFilter && !rel.includes(onlyFilter)) return false;
  if (deptFilter) {
    const top = rel.split("/")[0] ?? "";
    if (
      top !== deptFilter &&
      !top.startsWith(deptFilter) &&
      corpusDirName(deptFilter) !== top
    ) {
      return false;
    }
  }
  return true;
}

const workers = (() => {
  const i = process.argv.indexOf("--workers");
  if (i >= 0) {
    const n = parseInt(process.argv[i + 1] ?? "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  if (onlyFilter || dirsOnly) return 1;
  // 全库约 6 万 MD，默认并行以缩短全量耗时
  return Math.min(8, Math.max(1, os.cpus().length));
})();

const shard = (() => {
  const arg = process.argv.find((a) => a.startsWith("--shard="));
  if (!arg) return null;
  const m = arg.slice("--shard=".length).match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  return { index: parseInt(m[1]!, 10), total: parseInt(m[2]!, 10) };
})();

const segmentCache = new Map<string, string>();

function convertSegment(text: string): string {
  let hit = segmentCache.get(text);
  if (hit !== undefined) return hit;
  hit = t2sBatch(text);
  segmentCache.set(text, hit);
  return hit;
}

/** 路径段转简体（含 白話→白话 等固定映射） */
export function simplifyPathSegment(segment: string): string {
  if (LEGACY_SUBDIR_RENAMES[segment]) return LEGACY_SUBDIR_RENAMES[segment];
  if (segment === "README.md" || segment.startsWith(".")) return segment;
  return convertSegment(segment);
}

function simplifyRelativePath(rel: string): string {
  return rel
    .split("/")
    .map((p) => simplifyPathSegment(p))
    .join("/");
}

function matchesOnlyFilter(absPath: string): boolean {
  return argMatchesPath(absPath);
}

function inShard(metaPath: string): boolean {
  if (!shard) return true;
  let h = 0;
  for (let i = 0; i < metaPath.length; i++) h = (h * 31 + metaPath.charCodeAt(i)) | 0;
  return Math.abs(h) % shard.total === shard.index;
}

function collectAllDirs(root: string): string[] {
  const dirs: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
      const full = path.join(dir, ent.name);
      dirs.push(full);
      walk(full);
    }
  };
  walk(root);
  return dirs;
}

function safeRenameDir(from: string, to: string): void {
  if (path.resolve(from) === path.resolve(to)) return;
  if (!fs.existsSync(from)) return;

  if (fs.existsSync(to)) {
    for (const ent of fs.readdirSync(from)) {
      const src = path.join(from, ent);
      const dst = path.join(to, ent);
      if (fs.statSync(src).isDirectory()) {
        safeRenameDir(src, dst);
      } else if (!fs.existsSync(dst)) {
        fs.renameSync(src, dst);
      }
    }
    fs.rmSync(from, { recursive: true, force: true });
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

function planDirRenames(root: string): { from: string; to: string }[] {
  const allDirs = collectAllDirs(root).filter(matchesOnlyFilter);
  const ops: { from: string; to: string; depth: number }[] = [];

  for (const abs of allDirs) {
    const rel = path.relative(root, abs).replace(/\\/g, "/");
    const newRel = simplifyRelativePath(rel);
    if (newRel !== rel) {
      ops.push({
        from: abs,
        to: path.join(root, ...newRel.split("/")),
        depth: newRel.split("/").length,
      });
    }
  }

  ops.sort((a, b) => b.depth - a.depth);
  const used = new Set<string>();
  const out: { from: string; to: string }[] = [];

  for (const op of ops) {
    if (used.has(op.to)) continue;
    if (fs.existsSync(op.to) && path.resolve(op.to) !== path.resolve(op.from)) {
      out.push({ from: op.from, to: op.to });
      continue;
    }
    used.add(op.to);
    out.push({ from: op.from, to: op.to });
  }
  return out;
}

function simplifyMeta(meta: SutraMeta): SutraMeta {
  const title = convertSegment(meta.title);
  const translator = meta.translator ? convertSegment(meta.translator) : meta.translator;
  const dynasty = meta.dynasty ? convertSegment(meta.dynasty) : meta.dynasty;
  const zaijia = meta.zaijia
    ? {
        section: meta.zaijia.section ? convertSegment(meta.zaijia.section) : undefined,
        topic: meta.zaijia.topic ? convertSegment(meta.zaijia.topic) : undefined,
        kind: meta.zaijia.kind,
      }
    : undefined;
  return {
    ...meta,
    title,
    translator,
    dynasty,
    zaijia,
  };
}

/** 整文件一次 t2s，跳过内容未变的文件 */
function convertMdFile(filePath: string): boolean {
  const raw = fs.readFileSync(filePath, "utf-8");
  const out = t2sBatch(raw);
  if (out === raw) return false;
  if (!dryRun) {
    fs.writeFileSync(filePath, out.endsWith("\n") ? out : `${out}\n`, "utf-8");
  }
  return true;
}

function removeJiantiDirIfRedundant(sutraRoot: string): void {
  const jianti = path.join(sutraRoot, DIR_JIANTI_LEGACY);
  if (!fs.existsSync(jianti)) return;
  if (!dryRun) fs.rmSync(jianti, { recursive: true, force: true });
}

function runMdPhase(): { mdFiles: number; metaUpdated: number } {
  let mdFiles = 0;
  let metaUpdated = 0;
  let processed = 0;

  const metaFiles = findSutraMetaFiles(corpusRoot)
    .filter(shouldProcessMeta)
    .filter(inShard);

  const t0 = Date.now();
  for (const metaPath of metaFiles) {
    if (!fs.existsSync(metaPath)) continue;
    const sutraRoot = path.dirname(metaPath);

    for (const fp of collectSimplifyMdFiles(sutraRoot)) {
      if (convertMdFile(fp)) mdFiles += 1;
    }

    try {
      const meta = loadSutraMeta(metaPath);
      const next = simplifyMeta(meta);
      const changed =
        next.title !== meta.title ||
        next.translator !== meta.translator ||
        next.zaijia?.section !== meta.zaijia?.section ||
        next.zaijia?.topic !== meta.zaijia?.topic;
      if (changed) {
        if (!dryRun) writeSutraMeta(metaPath, next);
        metaUpdated += 1;
      }
    } catch (e) {
      if (!quiet) console.warn(`meta skip ${metaPath}:`, e);
    }

    if (mergeJiantiIntoYuanwen) removeJiantiDirIfRedundant(sutraRoot);

    processed += 1;
    if (!quiet && processed % 200 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  … ${processed}/${metaFiles.length} sutras, md=${mdFiles} (${elapsed}s)`);
    }
  }

  return { mdFiles, metaUpdated };
}

function shouldProcessMeta(metaPath: string): boolean {
  return argMatchesPath(path.dirname(metaPath));
}

function runDirsPhase(): number {
  let dirsRenamed = 0;
  const renames = planDirRenames(corpusRoot);
  for (const { from, to } of renames) {
    if (!fs.existsSync(from)) continue;
    if (!quiet) {
      const rel = path.relative(corpusRoot, from).replace(/\\/g, "/");
      const destRel = path.relative(corpusRoot, to).replace(/\\/g, "/");
      console.log(`${dryRun ? "[dry-run] " : ""}${rel} -> ${destRel}`);
    }
    if (!dryRun) safeRenameDir(from, to);
    dirsRenamed += 1;
  }
  return dirsRenamed;
}

function spawnWorkers(n: number): Promise<void> {
  const script = path.join(process.cwd(), "scripts/corpus-simplify.ts");
  const baseArgs = process.argv.slice(2).filter((a) => !a.startsWith("--workers"));
  const env = { ...process.env, CORPUS_SIMPLIFY_PARENT: "1" };

  return new Promise((resolve, reject) => {
    let done = 0;
    let failed = false;
    for (let i = 0; i < n; i++) {
      const args = ["tsx", script, ...baseArgs, "--md-only", `--shard=${i}/${n}`, "--quiet"];
      const child = spawn("npx", args, { stdio: "inherit", env, cwd: process.cwd() });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code !== 0) failed = true;
        done += 1;
        if (done === n) (failed ? reject(new Error("worker failed")) : resolve());
      });
    }
  });
}

async function main(): Promise<void> {
  const t0 = Date.now();

  if (workers > 1 && !shard && !process.env.CORPUS_SIMPLIFY_PARENT && !dirsOnly) {
    console.log(`Phase 1: ${workers} workers converting markdown…`);
    await spawnWorkers(workers);
    if (!mdOnly) {
      console.log("Phase 2: rename directories…");
      const dirs = runDirsPhase();
      console.log(`Done: dirs=${dirs} workers=${workers} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    return;
  }

  let mdFiles = 0;
  let metaUpdated = 0;
  let dirsRenamed = 0;

  if (!dirsOnly) {
    console.log(
      `Phase 1: convert markdown${shard ? ` shard ${shard.index + 1}/${shard.total}` : ""}…`,
    );
    ({ mdFiles, metaUpdated } = runMdPhase());
  }

  if (!mdOnly) {
    console.log("Phase 2: rename directories…");
    dirsRenamed = runDirsPhase();
  }

  console.log(
    `Done: md=${mdFiles} meta=${metaUpdated} dirs=${dirsRenamed} dryRun=${dryRun} ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

function isDirectRun(): boolean {
  const entry = process.argv[1] ?? "";
  return entry.includes("corpus-simplify");
}

if (isDirectRun()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
