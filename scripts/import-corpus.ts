/**
 * 从 Markdown 语料导入 SQLite（Corpus V3）
 * text 字段存简体，繁/拼音实时生成
 * @author 代长亚
 */
import { execSync } from "child_process";
import { sutraIdFromCbetaId } from "@/lib/corpus/ids";
import { getSqlite, closeDb } from "@/lib/db";
import { buildImportBundle } from "@/lib/corpus-v3/import-align";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const mdOnly = process.argv.includes("--md-only");

const db = getSqlite();

const upsertSutra = db.prepare(`
  INSERT INTO sutra (id, cbeta_id, slug, title, translator, category, char_count)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(cbeta_id) DO UPDATE SET
    slug=excluded.slug, title=excluded.title,
    translator=excluded.translator, category=excluded.category, char_count=excluded.char_count
`);

const upsertChapter = db.prepare(`
  INSERT INTO chapter (id, sutra_id, seq, title)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    sutra_id=excluded.sutra_id, seq=excluded.seq, title=excluded.title
`);

const upsertParagraph = db.prepare(`
  INSERT INTO paragraph (id, sutra_id, juan_seq, start_ref, end_ref, parser_pid, content_hash, seq, text, colloquial, commentary, lecture)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    sutra_id=excluded.sutra_id, juan_seq=excluded.juan_seq, start_ref=excluded.start_ref, end_ref=excluded.end_ref,
    parser_pid=excluded.parser_pid, content_hash=excluded.content_hash, seq=excluded.seq,
    text=excluded.text, colloquial=excluded.colloquial, commentary=excluded.commentary, lecture=excluded.lecture
`);

const deleteParagraph = db.prepare(`DELETE FROM paragraph WHERE id = ?`);

function chapterIdFor(cbetaId: string, seq: number): string {
  return `${cbetaId}-juan-${String(seq).padStart(3, "0")}`;
}

function importOneSutra(metaPath: string): { paragraphs: number; warnings: number } {
  const agg = buildImportBundle({
    corpusRoot,
    xmlRoot,
    metaPath,
    stripPreface: true,
    mdOnly,
  });

  let warnCount = 0;
  for (const w of agg.warnings) {
    console.warn(`WARN: ${w}`);
    warnCount += 1;
  }

  const charCount = agg.paragraphs.reduce((s, p) => s + p.text.length, 0);
  const sutraId = sutraIdFromCbetaId(agg.cbetaId);

  const importTx = db.transaction(() => {
    upsertSutra.run(
      sutraId,
      agg.cbetaId,
      agg.slug,
      agg.title,
      agg.translator,
      agg.category,
      charCount,
    );

    const chapterIds: string[] = [];
    for (const ch of agg.chapters) {
      const chId = chapterIdFor(agg.cbetaId, ch.seq);
      chapterIds.push(chId);
      upsertChapter.run(chId, sutraId, ch.seq, ch.title);
    }

    const existingChapters = db
      .prepare(`SELECT id FROM chapter WHERE sutra_id = ?`)
      .all(sutraId) as Array<{ id: string }>;
    for (const row of existingChapters) {
      if (!chapterIds.includes(row.id)) {
        db.prepare(`DELETE FROM chapter WHERE id = ?`).run(row.id);
      }
    }

    const incomingIds = new Set(agg.paragraphs.map((p) => p.canonicalId));
    const existing = db
      .prepare(`SELECT id FROM paragraph WHERE sutra_id = ?`)
      .all(sutraId) as Array<{ id: string }>;
    for (const row of existing) {
      if (!incomingIds.has(row.id)) deleteParagraph.run(row.id);
    }

    for (const p of agg.paragraphs) {
      upsertParagraph.run(
        p.canonicalId,
        sutraId,
        p.juanSeq,
        p.startRef,
        p.endRef,
        p.parserPid,
        p.contentHash,
        p.seq,
        p.text,
        p.colloquial,
        p.commentary,
        p.lecture,
      );
    }
  });

  importTx();

  console.log(
    `Imported ${agg.slug} (${agg.cbetaId}): ${agg.paragraphs.length} blocks, ${agg.chapters.length} juans`,
  );

  return { paragraphs: agg.paragraphs.length, warnings: warnCount };
}

const metaFiles = findSutraMetaFiles(corpusRoot);
if (metaFiles.length === 0) {
  console.error(`No meta.yaml found under ${corpusRoot}`);
  process.exit(1);
}

let importedSutras = 0;
let importedParagraphs = 0;
const total = metaFiles.length;

for (let i = 0; i < metaFiles.length; i++) {
  const metaPath = metaFiles[i]!;
  try {
    const { paragraphs } = importOneSutra(metaPath);
    importedParagraphs += paragraphs;
    importedSutras += 1;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`IMPORT ERROR ${metaPath}: ${msg}`);
  }
  if ((i + 1) % 50 === 0) {
    console.log(`Import progress ${i + 1}/${total} sutras=${importedSutras} paragraphs=${importedParagraphs}`);
  }
}

execSync("npm run fts:rebuild", { stdio: "inherit", cwd: process.cwd() });

console.log(`Done: ${importedSutras} sutras, ${importedParagraphs} paragraphs (mdOnly=${mdOnly})`);
closeDb();
