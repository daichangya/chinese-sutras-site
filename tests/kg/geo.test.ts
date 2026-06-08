/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { parseKgLatLng } from "@/lib/kg/geo";
import { getKgGeoEntities } from "@/lib/kg/graph";

describe("parseKgLatLng", () => {
  it("reads lat/lng keys", () => {
    expect(parseKgLatLng(JSON.stringify({ lat: 34.6, lng: 112.4 }))).toEqual({
      lat: 34.6,
      lng: 112.4,
    });
  });

  it("reads latitude/longitude keys", () => {
    expect(
      parseKgLatLng(JSON.stringify({ latitude: 35.1, longitude: 113.2 })),
    ).toEqual({ lat: 35.1, lng: 113.2 });
  });

  it("returns null for missing coords", () => {
    expect(parseKgLatLng(JSON.stringify({ province: "河南" }))).toBeNull();
  });
});

describe("getKgGeoEntities", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-geo-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, name_en TEXT,
        properties TEXT, source_tier TEXT, source TEXT
      );
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    for (let i = 0; i < 200; i++) {
      db.prepare(
        `INSERT INTO kg_entity VALUES (?, 'person', ?, NULL, NULL, 'authoritative', 'dila')`,
      ).run(`p${i}`, `人物${i}`);
    }
    db.prepare(
      `INSERT INTO kg_entity VALUES ('pl1', 'place', '洛阳', 'Luoyang', ?, 'authoritative', 'dila')`,
    ).run(JSON.stringify({ lat: 34.62, lng: 112.45, province: "河南", geo_source: "dila_lod" }));
    db.prepare(
      `INSERT INTO kg_entity VALUES ('pl2', 'place', '长安', NULL, ?, 'authoritative', 'dila')`,
    ).run(JSON.stringify({ latitude: 34.26, longitude: 108.94 }));
    db.prepare(
      `INSERT INTO kg_entity VALUES ('pp1', 'person', '玄奘', NULL, ?, 'authoritative', 'dila')`,
    ).run(
      JSON.stringify({
        lat: 34.5,
        lng: 112.5,
        geo_source: "wikidata:Q123",
      }),
    );
    db.prepare(
      `INSERT INTO kg_entity VALUES ('pp2', 'person', '无源人物', NULL, ?, 'authoritative', 'dila')`,
    ).run(JSON.stringify({ lat: 30, lng: 120 }));
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns geocoded places even when many coord-less persons precede them", () => {
    const all = getKgGeoEntities({ limit: 100 });
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.some((e) => e.name_zh === "洛阳")).toBe(true);
    expect(all.some((e) => e.name_zh === "长安")).toBe(true);
  });

  it("includes extended geo fields", () => {
    const luoyang = getKgGeoEntities({ limit: 100 }).find((e) => e.name_zh === "洛阳");
    expect(luoyang?.province).toBe("河南");
    expect(luoyang?.name_en).toBe("Luoyang");
    expect(luoyang?.geo_source).toBe("dila_lod");
  });

  it("filters by entity type", () => {
    const places = getKgGeoEntities({ types: ["place"], limit: 100 });
    expect(places.every((e) => e.entity_type === "place")).toBe(true);
    expect(places).toHaveLength(2);
  });

  it("hides persons without approved geo_source", () => {
    const persons = getKgGeoEntities({ types: ["person"], limit: 100 });
    expect(persons.map((p) => p.name_zh)).toEqual(["玄奘"]);
  });
});
