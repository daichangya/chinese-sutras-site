/**
 * 从 CBETA XML 批量恢复 corpus 原文/（繁体）与 _index
 * @author jingxin
 */
import { spawn } from "node:child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { restoreYuanwenFromXml } from "@/lib/corpus-v3/restore-yuanwen";
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const xmlRoot = path.resolve(process.env.CBETA_XML_DIR ?? "vendor/xml-p5");
const dryRun = process.argv.includes("--dry-run");
const quiet = process.argv.includes("--quiet");
const noStripPreface = process.argv.includes("--no-strip-preface");

const onlyFilter = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

const cbetaIdFilter = (() => {
  const i = process.argv.indexOf("--cbeta-id");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

const workers = (() => {
  const i = process.argv.indexOf("--workers");
  if (i >= 0) {
    const n = parseInt(process.argv[i + 1] ?? "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  if (onlyFilter || cbetaIdFilter) return 1;
  return Math.min(8, Math.max(1, os.cpus().length));
})();

const shard = (() => {
  const arg = process.argv.find((a) => a.startsWith("--shard="));
  if (!arg) return null;
  const m = arg.slice("--shard=".length).match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  return { index: parseInt(m[1]!, 10), total: parseInt(m[2]!, 10) };
})();

function shouldProcessMeta(metaPath: string): boolean {
  if (onlyFilter) {
    const rel = path.relative(corpusRoot, path.dirname(metaPath)).replace(/\\/g, "/");
    if (!rel.includes(onlyFilter)) return false;
  }
  if (cbetaIdFilter) {
    try {
      return loadSutraMeta(metaPath).cbetaId === cbetaIdFilter;
    } catch {
      return false;
    }
  }
  return true;
}

function inShard(metaPath: string): boolean {
  if (!shard) return true;
  let h = 0;
  for (let i = 0; i < metaPath.length; i++) h = (h * 31 + metaPath.charCodeAt(i)) | 0;
  return Math.abs(h) % shard.total === shard.index;
}

function runPhase(): {
  ok: number;
  skippedNoXml: number;
  skippedEmpty: number;
  juanFiles: number;
} {
  let ok = 0;
  let skippedNoXml = 0;
  let skippedEmpty = 0;
  let juanFiles = 0;

  const metaFiles = findSutraMetaFiles(corpusRoot).filter(shouldProcessMeta).filter(inShard);
  const t0 = Date.now();
  let processed = 0;

  for (const metaPath of metaFiles) {
    const result = restoreYuanwenFromXml({
      metaPath,
      corpusRoot,
      xmlRoot,
      stripPreface: !noStripPreface,
      dryRun,
    });
    if (result.status === "ok") {
      ok += 1;
      juanFiles += result.juanCount;
      if (!quiet) console.log(`${dryRun ? "[dry-run] " : ""}${result.cbetaId}: ${result.juanCount} juan, ${result.blockCount} blocks`);
    } else if (result.status === "skipped_no_xml") {
      skippedNoXml += 1;
      if (!quiet) console.warn(`skip (no xml): ${result.cbetaId}`);
    } else {
      skippedEmpty += 1;
    }

    processed += 1;
    if (!quiet && processed % 500 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  … ${processed}/${metaFiles.length} (${elapsed}s)`);
    }
  }

  return { ok, skippedNoXml, skippedEmpty, juanFiles };
}

function spawnWorkers(n: number): Promise<void> {
  const script = path.join(process.cwd(), "scripts/restore-corpus-yuanwen.ts");
  const baseArgs = process.argv.slice(2).filter((a) => !a.startsWith("--workers"));
  const env = { ...process.env, CORPUS_RESTORE_PARENT: "1" };

  return new Promise((resolve, reject) => {
    let done = 0;
    let failed = false;
    for (let i = 0; i < n; i++) {
      const args = [script, ...baseArgs, `--shard=${i}/${n}`, "--quiet"];
      const child = spawn("npx", ["tsx", ...args], { stdio: "inherit", env, cwd: process.cwd() });
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

  if (workers > 1 && !shard && !process.env.CORPUS_RESTORE_PARENT) {
    console.log(`Restoring 原文/ with ${workers} workers…`);
    await spawnWorkers(workers);
    console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return;
  }

  const stats = runPhase();
  console.log(
    `Done: ok=${stats.ok} juan=${stats.juanFiles} no_xml=${stats.skippedNoXml} empty=${stats.skippedEmpty} dryRun=${dryRun} ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
