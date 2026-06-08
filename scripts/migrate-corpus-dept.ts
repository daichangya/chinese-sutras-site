/**
 * 将 corpus 迁到统一部类目录（见 lib/cbeta/corpus-category.ts）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { resolveBuleiMeta } from "@/lib/cbeta/bulei-catalog";
import { canonDeptFromCbetaId, categoryFromCorpusDir, corpusDirName } from "@/lib/cbeta/corpus-category";
import {
  buildCorpusDirIndex,
  clearCorpusDirIndexCache,
  findSutraMetaFiles,
  loadSutraMeta,
  migrateSutraDirName,
  readCbetaIdFromMetaFile,
  buleiFieldsForCbetaId,
  writeSutraMeta,
} from "@/lib/corpus-v3/meta";
import { enrichMetaFromXml } from "@/lib/corpus-v3/meta-from-xml";
import {
  buildTitleCollisionIndex,
  deptDirFromMetaPath,
  refreshAuxMdTitles,
  resolveZwCollisionTitle,
} from "@/lib/corpus-v3/zw-title";

import { joinSutraPath, isReservedCorpusTopDir, resolveSutrasRoot } from "@/lib/corpus-v3/paths";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";
import { toSimplifiedLabel } from "@/lib/corpus-v3/sutra-labels";
import type { SutraMeta } from "@/lib/corpus-v3/types";

function metaWithSimplifiedLabels(meta: SutraMeta): SutraMeta {
  return {
    ...meta,
    title: toSimplifiedLabel(meta.title) ?? meta.title,
    translator: meta.translator
      ? (toSimplifiedLabel(meta.translator) ?? meta.translator)
      : meta.translator,
    dynasty: meta.dynasty ? (toSimplifiedLabel(meta.dynasty) ?? meta.dynasty) : meta.dynasty,
    dirLabel: meta.dirLabel ? (toSimplifiedLabel(meta.dirLabel) ?? meta.dirLabel) : meta.dirLabel,
  };
}

function buleiMetaChanged(a: SutraMeta["bulei"], b: SutraMeta["bulei"]): boolean {
  if (!b) return false;
  if (!a) return true;
  return (
    a.section !== b.section ||
    a.group !== b.group ||
    a.section_code !== b.section_code ||
    a.kind !== b.kind ||
    JSON.stringify(a.path ?? []) !== JSON.stringify(b.path ?? [])
  );
}

const DEFAULT_XML_ROOT = path.join(process.cwd(), "vendor/xml-p5");
const xmlRoot = process.env.CBETA_XML_ROOT ?? DEFAULT_XML_ROOT;

const corpusRoot = resolveCorpusRoot();
const dryRun = process.argv.includes("--dry-run");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

/** 仅处理路径包含该子串的经目，如 --only 般若/般若波羅蜜多心經 */
const onlyFilter = argValue("--only");
/** 仅处理当前顶层部类目录名，如 --dept 般若 或 --dept 新编（可写简称） */
const deptFilter = argValue("--dept");
/** hybrid：在部类下插入 bulei 分组目录 corpus/{部类}/{bulei组}/{经}/ */
const layoutBulei = process.argv.includes("--layout") && process.argv.includes("bulei");

function matchesDeptFilter(filter: string, currentTopDir: string, targetDeptDir: string): boolean {
  if (currentTopDir === filter || targetDeptDir === filter) return true;
  const fromDir = categoryFromCorpusDir(currentTopDir);
  const fromFilter = categoryFromCorpusDir(filter);
  if (fromDir && fromFilter && fromDir === fromFilter) return true;
  if (currentTopDir.startsWith(filter) || targetDeptDir.startsWith(filter)) return true;
  if (corpusDirName(filter) === currentTopDir || corpusDirName(filter) === targetDeptDir) return true;
  return false;
}

console.log("Building corpus dir index…");
const t0 = Date.now();
const dirIndex = buildCorpusDirIndex(corpusRoot);
const titleCollisionIndex = buildTitleCollisionIndex(corpusRoot);
console.log(`Index: ${dirIndex.relByCbetaId.size} sutras (${Date.now() - t0}ms)`);

function collectMetaPaths(): string[] {
  const sutrasRoot = resolveSutrasRoot(corpusRoot);
  if (onlyFilter) {
    const abs = path.join(sutrasRoot, onlyFilter.split("/")[0] ?? onlyFilter);
    if (onlyFilter.includes("/") && fs.existsSync(path.join(sutrasRoot, onlyFilter, "meta.yaml"))) {
      return [path.join(sutrasRoot, onlyFilter, "meta.yaml")];
    }
    if (!fs.existsSync(abs)) return findSutraMetaFiles(corpusRoot);
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === "meta.yaml") {
          const rel = path.relative(sutrasRoot, path.dirname(full)).replace(/\\/g, "/");
          if (rel.includes(onlyFilter)) out.push(full);
        }
      }
    };
    walk(abs);
    return out.sort();
  }
  if (deptFilter) {
    let deptRoot = joinSutraPath(corpusRoot, deptFilter);
    if (!fs.existsSync(deptRoot)) {
      const alt = fs
        .readdirSync(sutrasRoot, { withFileTypes: true })
        .find((e) => e.isDirectory() && e.name.startsWith(deptFilter));
      if (!alt) return [];
      deptRoot = path.join(sutrasRoot, alt.name);
    }
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === "meta.yaml") out.push(full);
      }
    };
    walk(deptRoot);
    return out.sort();
  }
  return findSutraMetaFiles(corpusRoot);
}

let moved = 0;
let updated = 0;
let skipped = 0;

for (const metaPath of collectMetaPaths()) {
  if (!fs.existsSync(metaPath)) continue;
  const sutraDir = path.dirname(metaPath);
  if (!fs.existsSync(sutraDir)) continue;
  let meta;
  let metaBackfilled = false;
  let oldTitle = "";
  try {
    const loaded = loadSutraMeta(metaPath);
    oldTitle = loaded.title;
    meta = enrichMetaFromXml(loaded, metaPath);
    const currentDeptDir = deptDirFromMetaPath(corpusRoot, metaPath);
    const enrichedTitle = resolveZwCollisionTitle(
      meta,
      currentDeptDir,
      corpusRoot,
      xmlRoot,
      titleCollisionIndex,
    );
    if (enrichedTitle !== meta.title) {
      meta = { ...meta, title: enrichedTitle };
    }
    metaBackfilled =
      meta.translator !== loaded.translator ||
      meta.juanCount !== loaded.juanCount ||
      meta.dynasty !== loaded.dynasty ||
      meta.dirLabel !== loaded.dirLabel ||
      meta.title !== loaded.title;
  } catch {
    continue;
  }
  const beforeSimplify = meta;
  meta = metaWithSimplifiedLabels(meta);
  const needsSimplifiedLabels =
    meta.title !== beforeSimplify.title ||
    meta.translator !== beforeSimplify.translator ||
    meta.dynasty !== beforeSimplify.dynasty ||
    meta.dirLabel !== beforeSimplify.dirLabel;
  const category = canonDeptFromCbetaId(meta.cbetaId, meta.title);
  const deptDir = corpusDirName(category);

  const currentRel = path.relative(resolveSutrasRoot(corpusRoot), sutraDir).replace(/\\/g, "/");
  const currentDeptLabel = currentRel.split("/")[0] ?? "";

  if (deptFilter && !matchesDeptFilter(deptFilter, currentDeptLabel, deptDir)) {
    skipped += 1;
    continue;
  }
  if (onlyFilter && !currentRel.includes(onlyFilter)) {
    skipped += 1;
    continue;
  }

  const titleDir = migrateSutraDirName(
    meta.title,
    meta.cbetaId,
    deptDir,
    meta.translator,
    dirIndex,
    meta.juanCount,
    meta.dynasty,
    meta.dirLabel,
  );
  const buleiGroup = layoutBulei ? resolveBuleiMeta(meta.cbetaId)?.groupDir : undefined;
  const destDir = buleiGroup
    ? joinSutraPath(corpusRoot, deptDir, buleiGroup, titleDir)
    : joinSutraPath(corpusRoot, deptDir, titleDir);
  const destRel = (buleiGroup ? path.join(deptDir, buleiGroup, titleDir) : path.join(deptDir, titleDir)).replace(
    /\\/g,
    "/",
  );

  const needsMove = path.resolve(destDir) !== path.resolve(sutraDir);
  const needsMeta = meta.category !== category || metaBackfilled || needsSimplifiedLabels;
  const bulei = buleiFieldsForCbetaId(meta.cbetaId);
  const needsBulei = buleiMetaChanged(meta.bulei, bulei);

  if (!needsMove && !needsMeta && !needsBulei) {
    skipped += 1;
    continue;
  }

  if (needsMove && fs.existsSync(destDir)) {
    const destId = readCbetaIdFromMetaFile(path.join(destDir, "meta.yaml"));
    if (destId === meta.cbetaId) {
      console.log(
        `${dryRun ? "[dry-run] " : ""}remove duplicate ${currentRel} (same cbetaId already in ${deptDir})`,
      );
      if (!dryRun) {
        fs.rmSync(sutraDir, { recursive: true, force: true });
        dirIndex.cbetaIdByRel.delete(currentRel);
      }
      moved += 1;
      continue;
    }
    console.error(`SKIP conflict: ${currentRel} -> ${destRel}`);
    continue;
  }

  if (needsMove) {
    if (!fs.existsSync(sutraDir)) {
      skipped += 1;
      continue;
    }
    console.log(`${dryRun ? "[dry-run] " : ""}${currentRel} -> ${destRel}`);
    if (!dryRun) {
      fs.mkdirSync(
        buleiGroup ? joinSutraPath(corpusRoot, deptDir, buleiGroup) : joinSutraPath(corpusRoot, deptDir),
        { recursive: true },
      );
      if (!fs.existsSync(sutraDir)) {
        skipped += 1;
        continue;
      }
      try {
        fs.renameSync(sutraDir, destDir);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "ENOENT") {
          console.warn(`SKIP missing source: ${currentRel} -> ${destRel}`);
          skipped += 1;
          continue;
        }
        throw err;
      }
      dirIndex.cbetaIdByRel.delete(currentRel);
      dirIndex.cbetaIdByRel.set(destRel, meta.cbetaId);
      dirIndex.relByCbetaId.set(meta.cbetaId, destRel);
    }
    moved += 1;
  } else if (needsMeta) {
    console.log(`${dryRun ? "[dry-run] " : ""}meta ${currentRel} category -> ${category}`);
  }

  if (!dryRun && (needsMove || needsMeta || needsBulei)) {
    const targetDir = needsMove ? destDir : sutraDir;
    writeSutraMeta(path.join(targetDir, "meta.yaml"), { ...meta, category, bulei });
    if (meta.title !== oldTitle) {
      refreshAuxMdTitles(targetDir, oldTitle, meta.title);
    }
    updated += 1;
  } else if (needsMeta || needsBulei) {
    updated += 1;
  }
}

if (!dryRun) {
  clearCorpusDirIndexCache();
  const removeEmpty = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) removeEmpty(path.join(dir, entry.name));
    }
    try {
      if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    } catch {
      /* ignore */
    }
  };
  const pruneRoots = [resolveSutrasRoot(corpusRoot)];
  if (pruneRoots[0] !== path.resolve(corpusRoot)) pruneRoots.push(corpusRoot);
  for (const root of pruneRoots) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (root === path.resolve(corpusRoot) && isReservedCorpusTopDir(entry.name)) continue;
      removeEmpty(path.join(root, entry.name));
    }
  }
}

console.log(`Done: moved=${moved} meta_updated=${updated} skipped=${skipped} dryRun=${dryRun}`);
