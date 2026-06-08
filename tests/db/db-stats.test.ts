/**
 * db-stats 报告
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { describe, it, expect, afterEach } from "vitest";
import { collectDbStats } from "@/lib/db/db-stats";

describe("collectDbStats", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });

  it("reports table sizes for a small db file", () => {
    tmp = path.join(os.tmpdir(), `jingxin-db-stats-${Date.now()}.db`);
    const db = new Database(tmp);
    db.exec(`CREATE TABLE paragraph (id TEXT PRIMARY KEY, text TEXT NOT NULL);
             INSERT INTO paragraph VALUES ('a', '测试正文');`);
    db.close();

    const report = collectDbStats(tmp);
    expect(report.fileMb).toBeGreaterThan(0);
    expect(report.tables.some((t) => t.name === "paragraph")).toBe(true);
  });
});
