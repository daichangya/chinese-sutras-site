/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { auditDbSimplifiedStorage } from "@/lib/db/script-health";

describe("auditDbSimplifiedStorage", () => {
  it("flags traditional paragraph samples", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-script-"));
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`CREATE TABLE paragraph (id TEXT PRIMARY KEY, text TEXT NOT NULL)`);
    db.prepare(`INSERT INTO paragraph VALUES ('p1', ?)`).run("如是我聞。一時佛在舍衛國。");
    db.prepare(`INSERT INTO paragraph VALUES ('p2', ?)`).run("如是我闻。一时佛在舍卫国。");
    const audit = auditDbSimplifiedStorage(db, 10);
    expect(audit.paragraphTraditional).toBeGreaterThan(0);
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
