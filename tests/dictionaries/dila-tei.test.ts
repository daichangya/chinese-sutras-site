/**
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { parseSoothillEntry, parseTeiEntries } from "@/lib/dictionaries/dila-tei";
import { parseEntriesFromXml } from "@/lib/dictionaries/import-dila";
import { getHanDictionarySource } from "@/lib/dictionaries/sources";

const fixture = fs.readFileSync(
  path.join(process.cwd(), "tests/fixtures/dictionaries/soothill-sample.xml"),
  "utf-8",
);

describe("dila-tei", () => {
  it("parses sample entries", () => {
    const raw = parseTeiEntries(fixture);
    expect(raw.length).toBeGreaterThanOrEqual(2);
    const first = parseSoothillEntry(raw[0], 0, "soothill");
    expect(first?.headword).toBe("般若");
    expect(first?.definition).toContain("智慧");
  });

  it("parseEntriesFromXml returns unique ids", () => {
    const meta = getHanDictionarySource("soothill")!;
    const records = parseEntriesFromXml(fixture, meta);
    const ids = new Set(records.map((r) => r.id));
    expect(records.length).toBe(ids.size);
    expect(records.every((r) => r.headword && r.definition)).toBe(true);
  });
});
