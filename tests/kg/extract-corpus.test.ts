/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { extractKgFromCorpus } from "@/lib/kg/extract-corpus";
import type { KgEntityRecord } from "@/lib/kg/types";

describe("extractKgFromCorpus", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("creates text entity and translated relation when person matches", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kg-corpus-"));
    const sutraDir = path.join(tmp, "般若", "心经_T01n0220");
    fs.mkdirSync(sutraDir, { recursive: true });
    fs.writeFileSync(
      path.join(sutraDir, "meta.yaml"),
      `cbeta_id: T0220
title: 般若波罗蜜多心经
slug: heart-sutra
translator: 玄奘
dynasty: 唐
`,
      "utf-8",
    );

    const seed: KgEntityRecord[] = [
      {
        id: "kg:person:dila:A1",
        entity_type: "person",
        name_zh: "玄奘",
        source_tier: "authoritative",
        source: "dila_lod",
      },
    ];

    const { entities, relations } = extractKgFromCorpus(tmp, seed);
    expect(entities.some((e) => e.id === "kg:text:T0220")).toBe(true);
    expect(relations.some((r) => r.predicate === "translated" && r.object_id === "kg:text:T0220")).toBe(
      true,
    );
  });

  it("matches DILA person from CBETA-style translator label", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kg-corpus-"));
    const sutraDir = path.join(tmp, "论藏", "成唯识论_T31n1585");
    fs.mkdirSync(sutraDir, { recursive: true });
    fs.writeFileSync(
      path.join(sutraDir, "meta.yaml"),
      `cbeta_id: T1585
title: 成唯识论
slug: cheng-weishi-lun
translator: 唐 玄奘译
dynasty: 唐
`,
      "utf-8",
    );

    const seed: KgEntityRecord[] = [
      {
        id: "kg:person:dila:A1",
        entity_type: "person",
        name_zh: "玄奘",
        source_tier: "authoritative",
        source: "dila_lod",
      },
    ];

    const { relations } = extractKgFromCorpus(tmp, seed);
    expect(
      relations.some(
        (r) =>
          r.predicate === "translated" &&
          r.subject_id === "kg:person:dila:A1" &&
          r.object_id === "kg:text:T1585",
      ),
    ).toBe(true);
  });
});
