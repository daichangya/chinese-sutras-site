/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db";
import {
  flattenGroupedDictionary,
  lookupDictionaryEntries,
  lookupDictionaryGrouped,
} from "@/lib/db/dict-kg";

function seedDb(dbPath: string) {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE dict_entry (
      id TEXT PRIMARY KEY, source TEXT, headword TEXT, definition TEXT,
      reading TEXT, lang TEXT, license TEXT, entry_data TEXT
    );
    CREATE VIRTUAL TABLE dict_entry_fts USING fts5(headword, definition, tokenize='unicode61');
  `);

  const rows = [
    ["dfb:1", "dingfubao", "般若", "智慧到彼岸。", null, null],
    ["dfb:2", "dingfubao", "般若波罗蜜", "六度之一。", null, null],
    ["nsl:1", "nanshanlu", "般若", "律学释义。", null, null],
    ["soothill:1", "soothill", "观音", "菩萨。", null, null],
    [
      "fg:1",
      "foguang",
      "䞋",
      "䞋 禅林用语。",
      null,
      JSON.stringify({ definition_html: '<span>䞋</span><a href="/dictionary?q=达嚫">达嚫</a>' }),
    ],
  ] as const;

  const insert = db.prepare(
    `INSERT INTO dict_entry VALUES (?, ?, ?, ?, ?, 'zh', NULL, ?)`,
  );
  const insertFts = db.prepare(
    `INSERT INTO dict_entry_fts(rowid, headword, definition) VALUES (?, ?, ?)`,
  );
  for (const [id, source, headword, definition, reading, entry_data] of rows) {
    insert.run(id, source, headword, definition, reading, entry_data);
    const row = db.prepare(`SELECT rowid FROM dict_entry WHERE id=?`).get(id) as {
      rowid: number;
    };
    insertFts.run(row.rowid, headword, definition);
  }
  db.close();
}

describe("lookupDictionaryEntries", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-dict-"));
    process.env.DATA_DIR = tmpDir;
    seedDb(path.join(tmpDir, "jingxin.db"));
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("puts exact 般若 before 般若波罗蜜", () => {
    const rows = lookupDictionaryEntries("般若", 10);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.headword).toBe("般若");
    const dfb = rows.filter((r) => r.source === "dingfubao");
    expect(dfb[0]!.headword).toBe("般若");
  });

  it("normalizes traditional query to match simplified headword", () => {
    const rows = lookupDictionaryEntries("觀音", 5);
    expect(rows.some((r) => r.headword === "观音")).toBe(true);
  });

  it("groups by source with sort order", () => {
    const grouped = lookupDictionaryGrouped("般若", { size: 5 });
    expect(grouped.groups.length).toBeGreaterThanOrEqual(2);
    expect(grouped.groups[0]!.source).toBe("dingfubao");
    expect(grouped.groups.every((g) => g.entries[0]!.headword === "般若")).toBe(true);
  });

  it("flattenGroupedDictionary round-robins across sources", () => {
    const grouped = lookupDictionaryGrouped("般若", { size: 5 });
    const flat = flattenGroupedDictionary(grouped, 4);
    const sources = new Set(flat.map((r) => r.source));
    expect(sources.size).toBeGreaterThanOrEqual(2);
  });

  it("returns definitionHtml from entry_data", () => {
    const rows = lookupDictionaryEntries("䞋", 5, "foguang");
    expect(rows.length).toBe(1);
    expect(rows[0]!.definitionHtml).toContain("/dictionary?q=");
  });
});
