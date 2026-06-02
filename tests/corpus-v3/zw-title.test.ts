import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  enrichTitleForZwCollision,
  extractZwVolumeLabelFromXml,
  shouldEnrichZwTitle,
  stripZwVolumeTitleSuffix,
} from "@/lib/corpus-v3/zw-title";
import { migrateSutraDirName, sutraDirNameCandidates } from "@/lib/corpus-v3/sutra-dir-name";
import { buildCorpusDirIndex } from "@/lib/corpus-v3/meta";

const ZW08_XML = fs.readFileSync(
  path.join(process.cwd(), "vendor/xml-p5/ZW/ZW08/ZW08nA047.xml"),
  "utf-8",
);

describe("extractZwVolumeLabelFromXml", () => {
  it("reads ZW vol from publicationStmt idno", () => {
    expect(extractZwVolumeLabelFromXml(ZW08_XML, "ZW08na047")).toBe("ZW第8卷");
  });

  it("falls back to cbetaId prefix", () => {
    expect(extractZwVolumeLabelFromXml("", "ZW09na054")).toBe("ZW第9卷");
  });
});

describe("stripZwVolumeTitleSuffix", () => {
  it("removes appended ZW vol suffix", () => {
    expect(stripZwVolumeTitleSuffix("《藏外佛教文献》第一～九辑要目（ZW第8卷）")).toBe(
      "《藏外佛教文献》第一～九辑要目",
    );
  });
});

describe("ZW title collision → directory names", () => {
  it("enriched titles allow both sutras to use _1卷 suffix", () => {
    const title8 = "《藏外佛教文献》第一～九辑要目（ZW第8卷）";
    const title9 = "《藏外佛教文献》第一～九辑要目（ZW第9卷）";
    const dept = "新编（新增及近现代文献）";
    const index = buildCorpusDirIndex("/nonexistent");

    expect(
      sutraDirNameCandidates({ title: title8, cbetaId: "ZW08na047", juanCount: 1 }),
    ).toEqual(["《藏外佛教文献》第一～九辑要目（ZW第8卷）_1卷", "《藏外佛教文献》第一～九辑要目（ZW第8卷）_ZW08na047"]);
    expect(
      sutraDirNameCandidates({ title: title9, cbetaId: "ZW09na054", juanCount: 1 }),
    ).toEqual(["《藏外佛教文献》第一～九辑要目（ZW第9卷）_1卷", "《藏外佛教文献》第一～九辑要目（ZW第9卷）_ZW09na054"]);

    expect(migrateSutraDirName(title8, "ZW08na047", dept, undefined, index, 1)).toBe(
      "《藏外佛教文献》第一～九辑要目（ZW第8卷）_1卷",
    );
    expect(migrateSutraDirName(title9, "ZW09na054", dept, undefined, index, 1)).toBe(
      "《藏外佛教文献》第一～九辑要目（ZW第9卷）_1卷",
    );
  });

  it("enrichTitleForZwCollision appends vol when index has duplicate group", () => {
    const collisionIndex = new Map([
      ["新编（新增及近现代文献）\0《藏外佛教文献》第一～九辑要目", ["ZW08na047", "ZW09na054"]],
    ]);
    const meta = {
      cbetaId: "ZW08na047",
      title: "《藏外佛教文献》第一～九辑要目",
      category: "新编（新增及近现代文献）",
      sourceXml: ["ZW/ZW08/ZW08nA047.xml"],
    };
    expect(
      enrichTitleForZwCollision(
        meta,
        "新编（新增及近现代文献）",
        collisionIndex,
        path.join(process.cwd(), "vendor/xml-p5"),
        "/tmp",
      ),
    ).toBe("《藏外佛教文献》第一～九辑要目（ZW第8卷）");
  });

  it("does not enrich unique ZW titles", () => {
    const collisionIndex = new Map<string, string[]>();
    const meta = {
      cbetaId: "ZW09n0073a",
      title: "金刚经赞集",
      category: "般若",
      sourceXml: [],
    };
    expect(
      shouldEnrichZwTitle(meta, "般若", collisionIndex, "/tmp"),
    ).toBe(false);
  });
});
