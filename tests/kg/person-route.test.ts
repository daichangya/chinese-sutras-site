/**
 * 人物页 slug 解析与误链重定向
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import {
  getSutraSlugForTextEntity,
  lookupKgEntityMeta,
  resolveEntityId,
} from "@/lib/kg/graph";
import { entityDetailPath } from "@/lib/kg/slug";

describe("person route slug resolution", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-person-route-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE sutra (
        id TEXT PRIMARY KEY, cbeta_id TEXT, slug TEXT, title TEXT
      );
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        name_zh TEXT NOT NULL,
        name_en TEXT,
        external_ids TEXT,
        properties TEXT,
        source_tier TEXT NOT NULL,
        source TEXT NOT NULL,
        text_id TEXT
      );
      CREATE TABLE kg_relation (
        subject_id TEXT, predicate TEXT, object_id TEXT
      );
    `);
    db.prepare(
      `INSERT INTO sutra VALUES ('s1', 'T08n0254', 't08n0254', '般若波罗蜜多心经')`,
    ).run();
    db.prepare(
      `INSERT INTO kg_entity VALUES (?, 'text', '般若波罗蜜多心经', NULL, NULL, NULL, 'derived', 'corpus', 'T08n0254')`,
    ).run("kg:text:T08n0254");
    db.prepare(
      `INSERT INTO kg_entity VALUES (?, 'person', '智慧', NULL, NULL, NULL, 'authoritative', 'dila', NULL)`,
    ).run("kg:person:dila:A001292");
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves text-T08n0254 to text entity without person hint", () => {
    expect(resolveEntityId("text-T08n0254")).toBe("kg:text:T08n0254");
  });

  it("does not resolve text slug as person", () => {
    expect(resolveEntityId("text-T08n0254", "person")).toBeUndefined();
  });

  it("builds sutra redirect path for misrouted person URL", () => {
    const entityId = resolveEntityId("text-T08n0254");
    expect(entityId).toBeDefined();
    const meta = lookupKgEntityMeta(entityId!);
    expect(meta?.entity_type).toBe("text");
    const sutraSlug = getSutraSlugForTextEntity(entityId!);
    expect(sutraSlug).toBe("t08n0254");
    expect(entityDetailPath(entityId!, "text", { sutraSlug })).toBe("/sutra/t08n0254");
  });
});
