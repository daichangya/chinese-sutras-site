/**
 * SQLite 体积与碎片统计（主库 / 检索库）
 * @author 代长亚
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export type TableSizeRow = {
  name: string;
  type: string;
  bytes: number;
  mb: number;
};

export type ColumnTextStats = {
  table: string;
  column: string;
  rowCount: number;
  sumLength: number;
  mbApprox: number;
};

export type DbStatsReport = {
  dbPath: string;
  fileBytes: number;
  fileMb: number;
  pageSize: number;
  pageCount: number;
  freelistCount: number;
  freelistMb: number;
  tables: TableSizeRow[];
  ftsTables: TableSizeRow[];
  columnText: ColumnTextStats[];
  paragraphFtsRows: number | null;
};

function mb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

function tableSizes(db: Database.Database): TableSizeRow[] {
  const rows = db
    .prepare(
      `SELECT name, SUM(pgsize) as bytes
       FROM dbstat
       GROUP BY name
       ORDER BY bytes DESC`,
    )
    .all() as Array<{ name: string; bytes: number }>;
  return rows.map((r) => ({
    name: r.name,
    type: r.name.includes("_fts") ? "fts" : "table",
    bytes: r.bytes,
    mb: mb(r.bytes),
  }));
}

function pragmaInt(db: Database.Database, key: string): number {
  const row = db.prepare(`PRAGMA ${key}`).get() as Record<string, number>;
  const v = Object.values(row)[0];
  return typeof v === "number" ? v : 0;
}

function hasTable(db: Database.Database, name: string): boolean {
  return !!db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === column);
}

function columnTextStats(db: Database.Database, table: string, column: string): ColumnTextStats | null {
  if (!hasTable(db, table) || !hasColumn(db, table, column)) return null;
  const row = db
    .prepare(
      `SELECT COUNT(*) as n, COALESCE(SUM(length(${column})), 0) as sumLen FROM ${table}`,
    )
    .get() as { n: number; sumLen: number };
  return {
    table,
    column,
    rowCount: row.n,
    sumLength: row.sumLen,
    mbApprox: mb(row.sumLen),
  };
}

/** 收集单库统计报告 */
export function collectDbStats(dbPath: string): DbStatsReport {
  const fileBytes = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;
  const db = new Database(dbPath, { readonly: true });
  try {
    const tables = tableSizes(db);
    const ftsTables = tables.filter(
      (t) => t.name.includes("_fts") || t.type === "shadow" || t.name.endsWith("_fts_data"),
    );
    const pageSize = pragmaInt(db, "page_size");
    const pageCount = pragmaInt(db, "page_count");
    const freelistCount = pragmaInt(db, "freelist_count");
    const freelistMb = mb(freelistCount * pageSize);

    const columnText: ColumnTextStats[] = [];
    for (const col of ["text", "colloquial", "commentary", "definition", "headword"] as const) {
      const tablesToCheck =
        col === "definition" || col === "headword"
          ? ["dict_entry"]
          : col === "text" || col === "colloquial" || col === "commentary"
            ? ["paragraph"]
            : [];
      for (const table of tablesToCheck) {
        const s = columnTextStats(db, table, col);
        if (s) columnText.push(s);
      }
    }

    let paragraphFtsRows: number | null = null;
    if (hasTable(db, "paragraph_fts")) {
      const c = db.prepare(`SELECT COUNT(*) as c FROM paragraph_fts`).get() as { c: number };
      paragraphFtsRows = c.c;
    }

    return {
      dbPath,
      fileBytes,
      fileMb: mb(fileBytes),
      pageSize,
      pageCount,
      freelistCount,
      freelistMb,
      tables,
      ftsTables,
      columnText,
      paragraphFtsRows,
    };
  } finally {
    db.close();
  }
}

export function formatDbStatsReport(label: string, report: DbStatsReport): string {
  const lines: string[] = [
    `=== ${label} ===`,
    `path: ${report.dbPath}`,
    `file: ${report.fileMb} MB (${report.fileBytes.toLocaleString()} bytes)`,
    `pages: ${report.pageCount} × ${report.pageSize} B, freelist: ${report.freelistCount} pages (~${report.freelistMb} MB)`,
  ];
  if (report.paragraphFtsRows != null) {
    lines.push(`paragraph_fts rows: ${report.paragraphFtsRows.toLocaleString()}`);
  }
  lines.push("", "Top tables (dbstat):");
  for (const t of report.tables.slice(0, 20)) {
    lines.push(`  ${t.name.padEnd(28)} ${t.type.padEnd(8)} ${t.mb} MB`);
  }
  if (report.columnText.length > 0) {
    lines.push("", "Column text volume:");
    for (const c of report.columnText) {
      lines.push(
        `  ${c.table}.${c.column}: rows=${c.rowCount.toLocaleString()} sum(length)=${c.sumLength.toLocaleString()} (~${c.mbApprox} MB)`,
      );
    }
  }
  return lines.join("\n");
}

export function resolveMainDbPath(dataDir?: string): string {
  const dir = dataDir ?? process.env.DATA_DIR ?? "./data";
  return path.join(dir, "jingxin.db");
}

export function resolveSearchDbPath(dataDir?: string): string {
  const dir = dataDir ?? process.env.DATA_DIR ?? "./data";
  return path.join(dir, "jingxin-search.db");
}
