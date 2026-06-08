/**
 * SQLite 数据健康检查（语料 / 辞典 / 图谱 / 白话）
 * @author 代长亚
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { isCorpusMounted } from "@/lib/corpus-v3/read-paragraph";
import { isLowMemoryDeploy } from "@/lib/deploy/profile";
import { paragraphHasTextColumn } from "@/lib/db/paragraph-schema";
import { auditDbSimplifiedStorage } from "@/lib/db/script-health";
import { resolveSearchDbPath } from "@/lib/db/db-stats";

type Metric = {
  key: string;
  label: string;
  count: number;
  strictMin?: number;
  hint?: string;
};

function openDb(): Database.Database {
  const dataDir = process.env.DATA_DIR ?? "./data";
  const dbPath = path.join(dataDir, "jingxin.db");
  const db = new Database(dbPath, { readonly: true });
  db.pragma("journal_mode = WAL");
  return db;
}

function count(db: Database.Database, sql: string): number {
  const row = db.prepare(sql).get() as { n: number } | undefined;
  return row?.n ?? 0;
}

function main() {
  const strict = process.argv.includes("--strict");
  const json = process.argv.includes("--json");
  const db = openDb();

  const colloquialSutras = count(
    db,
    `SELECT COUNT(DISTINCT sutra_id) as n FROM paragraph
     WHERE colloquial IS NOT NULL AND trim(colloquial) != ''`,
  );

  const placeEntities = count(
    db,
    `SELECT COUNT(*) as n FROM kg_entity
     WHERE entity_type IN ('place', 'monastery')
       AND properties IS NOT NULL
       AND json_extract(properties, '$.lat') IS NOT NULL
       AND json_extract(properties, '$.lng') IS NOT NULL`,
  );

  const searchDbPath = resolveSearchDbPath(process.env.DATA_DIR ?? "./data");
  const hasSearchDb = fs.existsSync(searchDbPath);
  const slimParagraphSchema = !paragraphHasTextColumn(db);
  const needsCorpusMount = isLowMemoryDeploy() || slimParagraphSchema;
  const corpusMounted = isCorpusMounted();

  const scriptAudit = auditDbSimplifiedStorage(db);
  const scriptIssues =
    scriptAudit.paragraphTraditional +
    scriptAudit.sutraTitleTraditional +
    scriptAudit.dictHeadwordTraditional +
    scriptAudit.kgNameTraditional +
    scriptAudit.kgDescriptionTraditional;

  const metrics: Metric[] = [
    { key: "sutra", label: "经目", count: count(db, "SELECT COUNT(*) as n FROM sutra"), strictMin: 1 },
    {
      key: "paragraph",
      label: "段落",
      count: count(db, "SELECT COUNT(*) as n FROM paragraph"),
      strictMin: 1,
    },
    {
      key: "dict_entry",
      label: "辞典词条",
      count: count(db, "SELECT COUNT(*) as n FROM dict_entry"),
      strictMin: 1,
      hint: "npm run dict:import:sqlite",
    },
    {
      key: "kg_entity",
      label: "KG 实体",
      count: count(db, "SELECT COUNT(*) as n FROM kg_entity"),
    },
    {
      key: "kg_relation",
      label: "KG 关系",
      count: count(db, "SELECT COUNT(*) as n FROM kg_relation"),
      strictMin: strict ? 1 : undefined,
      hint: "npm run kg:extract:corpus && npm run kg:merge && npm run kg:import:sqlite",
    },
    {
      key: "kg_entity_text",
      label: "KG 经目链接",
      count: count(db, "SELECT COUNT(*) as n FROM kg_entity_text"),
    },
    {
      key: "colloquial_sutras",
      label: "含白话经目",
      count: colloquialSutras,
    },
    {
      key: "place_entities",
      label: "地理实体",
      count: placeEntities,
    },
    {
      key: "script_audit_issues",
      label: "繁体抽样异常",
      count: scriptIssues,
      hint: "npm run corpus:import && npm run kg:simplify:properties && npm run fts:rebuild",
    },
    {
      key: "search_db",
      label: "检索库 jingxin-search.db",
      count: hasSearchDb ? 1 : 0,
      strictMin: strict ? 1 : undefined,
      hint: "npm run db:migrate:slim && npm run fts:rebuild",
    },
    {
      key: "corpus_mounted",
      label: "语料目录 chinese-sutras-md",
      count: corpusMounted ? 1 : 0,
      strictMin: strict && needsCorpusMount ? 1 : undefined,
      hint: "设置 CORPUS_DIR 并挂载 chinese-sutras-md（低内存 / slim 主库必填）",
    },
  ];

  const failures: Metric[] = [];
  for (const m of metrics) {
    if (strict && m.strictMin != null && m.count < m.strictMin) {
      failures.push(m);
    }
  }
  if (strict && scriptIssues > 0) {
    failures.push(metrics.find((m) => m.key === "script_audit_issues")!);
  }

  if (json) {
    console.log(JSON.stringify({ strict, metrics, failures: failures.map((f) => f.key) }, null, 2));
  } else {
    console.log("静心 data health\n");
    for (const m of metrics) {
      const flag = strict && m.strictMin != null && m.count < m.strictMin ? " FAIL" : "";
      console.log(`${m.label.padEnd(14)} ${m.count.toLocaleString()}${flag}`);
    }
    if (failures.length > 0) {
      console.log("\nStrict checks failed:");
      for (const f of failures) {
        console.log(`  - ${f.label}: ${f.count} (need >= ${f.strictMin})`);
        if (f.hint) console.log(`    → ${f.hint}`);
      }
    } else if (strict) {
      console.log("\nStrict checks: OK");
    }
    if (colloquialSutras === 0) {
      console.log("\nNote: 白话层为空 — 需在语料 白话/全文.md 写入内容后 corpus:import");
    }
    if (placeEntities === 0) {
      console.log("Note: 地理实体为空 — 运行 npm run kg:import:dila:place && npm run kg:import:sqlite");
    }
    if (scriptIssues > 0) {
      console.log(
        `\nScript audit (sample ${scriptAudit.sampleSize}): paragraph=${scriptAudit.paragraphTraditional}, title=${scriptAudit.sutraTitleTraditional}, dict=${scriptAudit.dictHeadwordTraditional}, kgName=${scriptAudit.kgNameTraditional}, kgDesc=${scriptAudit.kgDescriptionTraditional}`,
      );
      console.log("  → 用户面数据应以简体入库；见 docs/admin-guide/02-corpus-pipeline.md");
    }
  }

  db.close();
  if (strict && failures.length > 0) process.exit(1);
}

main();
