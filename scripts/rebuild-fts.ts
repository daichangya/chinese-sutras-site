/**
 * 从语料 MD 重建 paragraph_fts（写入 jingxin-search.db）
 * @author 代长亚
 */
import { buildImportBundle } from "@/lib/corpus-v3/import-align";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";
import { getSqlite, closeDb } from "@/lib/db/sqlite";
import {
  closeSearchDb,
  ensureSearchSchema,
  getSearchSqlite,
  resetParagraphFtsDbCache,
} from "@/lib/db/search-sqlite";
import { listSutraAliasKeys, resolveSutraAlias } from "@/lib/search/sutra-aliases";
import { normalizeSutraTitleForSearch } from "@/lib/search/query-normalize";
import { t2s } from "@/lib/han";

const ALIAS_BY_CBETA: Record<string, string[]> = {
  T08n0235: ["金刚经", "金剛經"],
  T08n0251: ["心经", "心經"],
  T09n0262: ["法华经", "法華經"],
  T10n0279: ["华严经", "華嚴經"],
  T19n0945: ["楞严经", "楞嚴經"],
  T48n2008: ["坛经", "壇經"],
};

function buildSutraFtsTitle(title: string, cbetaId: string): string {
  const norm = normalizeSutraTitleForSearch(title);
  const aliases = ALIAS_BY_CBETA[cbetaId.toUpperCase()] ?? [];
  const extra: string[] = [...aliases];
  for (const key of listSutraAliasKeys()) {
    const canonical = resolveSutraAlias(key);
    if (!canonical) continue;
    const canonS = t2s(canonical, { backend: "js" }).text;
    if (norm.includes(canonS.slice(0, 4)) || canonS.includes(norm.slice(0, 4))) {
      extra.push(key, canonical);
    }
  }
  return [title, norm, cbetaId, ...extra].join(" ");
}

function ftsBody(p: {
  text: string;
  colloquial: string | null;
  commentary: string | null;
  lecture: string | null;
}): string {
  return trimFts(
    "正文: " +
      p.text +
      (p.colloquial?.trim() ? "\n白话: " + p.colloquial : "") +
      (p.commentary?.trim() ? "\n注释: " + p.commentary : "") +
      (p.lecture?.trim() ? "\n讲记: " + p.lecture : ""),
  );
}

function trimFts(s: string): string {
  return s.trim();
}

const corpusRoot = resolveCorpusRoot();
const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const metaFiles = findSutraMetaFiles(corpusRoot);

const mainDb = getSqlite();
const sutraRows = mainDb
  .prepare(`SELECT id, cbeta_id as cbetaId, slug, title FROM sutra`)
  .all() as Array<{ id: string; cbetaId: string; slug: string; title: string }>;
const sutraByCbeta = new Map(sutraRows.map((r) => [r.cbetaId.toUpperCase(), r]));

const searchDb = getSearchSqlite();
ensureSearchSchema(searchDb);
searchDb.exec(`DELETE FROM paragraph_fts;`);

const insertParagraph = searchDb.prepare(`
  INSERT INTO paragraph_fts(
    paragraph_id, sutra_id, sutra_slug, sutra_title, cbeta_id, seq, text
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

type FtsRow = [string, string, string, string, string, string, string];
let indexed = 0;
const insertBatch = searchDb.transaction((rows: FtsRow[]) => {
  for (const row of rows) {
    insertParagraph.run(...row);
    indexed += 1;
  }
});

const BATCH = 500;
let batch: FtsRow[] = [];

for (let i = 0; i < metaFiles.length; i++) {
  const metaPath = metaFiles[i]!;
  try {
    const bundle = buildImportBundle({
      corpusRoot,
      xmlRoot,
      metaPath,
      stripPreface: true,
      mdOnly: true,
    });
    const sutra = sutraByCbeta.get(bundle.cbetaId.toUpperCase());
    for (const p of bundle.paragraphs) {
      batch.push([
        p.canonicalId,
        sutra?.id ?? "",
        bundle.slug,
        bundle.title,
        bundle.cbetaId,
        String(p.seq),
        ftsBody(p),
      ]);
      if (batch.length >= BATCH) {
        insertBatch(batch);
        batch = [];
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`FTS SKIP ${metaPath}: ${msg}`);
  }
  if ((i + 1) % 50 === 0) {
    console.log(`FTS progress ${i + 1}/${metaFiles.length} indexed=${indexed}`);
  }
}
if (batch.length > 0) insertBatch(batch);

const count = searchDb.prepare(`SELECT count(*) as c FROM paragraph_fts`).get() as { c: number };
console.log(`FTS indexed ${count.c} paragraphs in jingxin-search.db`);

const hasSutraFts = mainDb
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='sutra_fts'`)
  .get();
if (hasSutraFts) {
  mainDb.exec(`DELETE FROM sutra_fts;`);
  const sutras = mainDb
    .prepare(
      `SELECT id, title, coalesce(translator, '') as translator, coalesce(category, '') as category, cbeta_id FROM sutra`,
    )
    .all() as Array<{
      id: string;
      title: string;
      translator: string;
      category: string;
      cbeta_id: string;
    }>;
  const insert = mainDb.prepare(`
    INSERT INTO sutra_fts(sutra_id, title, translator, category, cbeta_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMany = mainDb.transaction((rows: typeof sutras) => {
    for (const row of rows) {
      insert.run(
        row.id,
        buildSutraFtsTitle(row.title, row.cbeta_id),
        row.translator,
        row.category,
        row.cbeta_id,
      );
    }
  });
  insertMany(sutras);
  const sutraCount = mainDb.prepare(`SELECT count(*) as c FROM sutra_fts`).get() as { c: number };
  console.log(`FTS indexed ${sutraCount.c} sutras (main DB)`);
}

resetParagraphFtsDbCache();
closeSearchDb();
closeDb();
