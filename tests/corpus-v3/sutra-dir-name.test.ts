import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildCorpusDirIndex } from "@/lib/corpus-v3/meta";
import {
  authorLabelFromTranslator,
  canonicalSutraDirName,
  isLegacyCbetaIdDirName,
  migrateSutraDirName,
  preferredSutraDirName,
  sutraDirName,
  sutraDirNameCandidates,
} from "@/lib/corpus-v3/sutra-dir-name";

describe("authorLabelFromTranslator", () => {
  it("extracts author from CBETA translator strings", () => {
    expect(authorLabelFromTranslator("唐 玄奘譯")).toBe("玄奘");
    expect(authorLabelFromTranslator("張總整理")).toBe("張總");
  });

  it("extracts author from simplified translator suffixes", () => {
    expect(authorLabelFromTranslator("民国 蓝吉富编")).toBe("蓝吉富");
    expect(authorLabelFromTranslator("唐 玄奘译")).toBe("玄奘");
  });
});

describe("sutraDirNameCandidates", () => {
  it("always includes juan suffix when juanCount is known", () => {
    expect(
      preferredSutraDirName("般若波羅蜜多心經", "唐 玄奘譯", "T08n0251", 1),
    ).toBe("般若波羅蜜多心經_玄奘_1卷");
    expect(preferredSutraDirName("大般若關", undefined, "F03n0181", 1)).toBe("大般若關_1卷");
  });

  it("uses plain juan without variant letter on卷 suffix", () => {
    expect(
      sutraDirNameCandidates({
        title: "金剛般若波羅蜜經",
        cbetaId: "T08n0236a",
        translator: "元魏 菩提流支譯",
        juanCount: 1,
      }),
    ).toEqual([
      "金剛般若波羅蜜經_菩提流支_1卷",
      "金剛般若波羅蜜經_菩提流支_n0236a",
      "金剛般若波羅蜜經_菩提流支",
      "金剛般若波羅蜜經_T08n0236a",
    ]);
  });

  it("prefers semantic disambiguator for ZW09n0073 variants", () => {
    expect(
      sutraDirNameCandidates({
        title: "金刚经赞集（拟）",
        cbetaId: "ZW09n0073b",
        translator: "达照整理",
        juanCount: 1,
        dirDisambiguator: "录文二",
      }),
    ).toEqual([
      "金刚经赞集（拟）_达照_录文二",
      "金刚经赞集（拟）_达照_n0073b",
      "金刚经赞集（拟）_达照",
      "金刚经赞集（拟）_ZW09n0073b",
    ]);
  });

  it("uses juan only when title and volume already distinguish variants", () => {
    expect(
      preferredSutraDirName("金刚般若论", "无着", "T25n1510a", 2),
    ).toBe("金刚般若论_无着_2卷");
    expect(
      preferredSutraDirName("金刚般若波罗蜜经论", "无着", "T25n1510b", 3),
    ).toBe("金刚般若波罗蜜经论_无着_3卷");
  });

  it("uses juan suffix for same author different volume count", () => {
    expect(
      preferredSutraDirName(
        "般若波羅密多心經講記",
        "民國 釋演培著",
        "YP02n0005",
        10,
      ),
    ).toBe("般若波羅密多心經講記_釋演培_10卷");
  });

  it("uses physical juan label for T07n0220 split volumes", () => {
    const title = "大般若波罗蜜多经(第401卷-第600卷)";
    expect(
      sutraDirNameCandidates({
        title,
        cbetaId: "T07n0220h",
        translator: "唐 玄奘译",
        juanCount: 1,
        dirDisambiguator: "第577卷",
      }),
    ).toEqual([
      `${title}_玄奘_第577卷`,
      `${title}_玄奘_n0220h`,
      `${title}_玄奘`,
      `${title}_T07n0220h`,
    ]);
    expect(
      sutraDirNameCandidates({
        title,
        cbetaId: "T07n0220j",
        translator: "唐 玄奘译",
        juanCount: 5,
        dirDisambiguator: "第579-583卷",
      }),
    ).toEqual([
      `${title}_玄奘_5卷`,
      `${title}_玄奘_第579-583卷`,
      `${title}_玄奘_n0220j`,
      `${title}_玄奘`,
      `${title}_T07n0220j`,
    ]);
    expect(
      preferredSutraDirName(title, "唐 玄奘译", "T07n0220i", 1, undefined, "第578卷"),
    ).toBe(`${title}_玄奘_第578卷`);
  });

  it("keeps extent juan for unique T05n0220a blocks", () => {
    const title = "大般若波罗蜜多经(第1卷-第200卷)";
    expect(
      preferredSutraDirName(title, "唐 玄奘译", "T05n0220a", 200, undefined, "第1-200卷"),
    ).toBe(`${title}_玄奘_200卷`);
  });
});

describe("migrateSutraDirName", () => {
  it("picks compact variant when base juan name is taken", () => {
    const dept = "般若";
    fs.rmSync(path.join("tests", "tmp", "migrate-sutra-dir"), { recursive: true, force: true });
    fs.mkdirSync(
      path.join("tests", "tmp", "migrate-sutra-dir", dept, "金剛般若波羅蜜經_菩提流支_1卷"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(
        "tests",
        "tmp",
        "migrate-sutra-dir",
        dept,
        "金剛般若波羅蜜經_菩提流支_1卷",
        "meta.yaml",
      ),
      "cbeta_id: T08n0236a\n",
    );
    const idx = buildCorpusDirIndex(path.join("tests", "tmp", "migrate-sutra-dir"));
    expect(
      migrateSutraDirName(
        "金剛般若波羅蜜經",
        "T08n0236b",
        dept,
        "元魏 菩提流支譯",
        idx,
        1,
      ),
    ).toBe("金剛般若波羅蜜經_菩提流支_n0236b");
  });

  it("picks semantic label when juan name conflicts", () => {
    const dept = "新编（新增及近现代文献）";
    const tmp = path.join("tests", "tmp", "migrate-sutra-semantic");
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(
      path.join(tmp, dept, "金刚经赞集（拟）_达照_1卷"),
      { recursive: true },
    );
    fs.writeFileSync(
      path.join(tmp, dept, "金刚经赞集（拟）_达照_1卷", "meta.yaml"),
      "cbeta_id: ZW09n0073b\n",
    );
    const idx = buildCorpusDirIndex(tmp);
    expect(
      migrateSutraDirName(
        "金刚经赞集（拟）",
        "ZW09n0073c",
        dept,
        "达照整理",
        idx,
        1,
        undefined,
        "录文三",
      ),
    ).toBe("金刚经赞集（拟）_达照_录文三");
  });

  it("picks physical juan label for T07n0220h vs i", () => {
    const dept = "般若";
    const title = "大般若波罗蜜多经(第401卷-第600卷)";
    const tmp = path.join("tests", "tmp", "migrate-t220-juan");
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(path.join(tmp, dept, `${title}_玄奘_第577卷`), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, dept, `${title}_玄奘_第577卷`, "meta.yaml"),
      "cbeta_id: T07n0220h\n",
    );
    const idx = buildCorpusDirIndex(tmp);
    expect(
      migrateSutraDirName(
        title,
        "T07n0220i",
        dept,
        "唐 玄奘译",
        idx,
        1,
        undefined,
        "第578卷",
      ),
    ).toBe(`${title}_玄奘_第578卷`);
  });
});

describe("sutraDirName", () => {
  it("uses title_author_juan", () => {
    const tmp = path.join("tests", "tmp", "sutra-dir-name");
    fs.rmSync(tmp, { recursive: true, force: true });
    const dept = "般若";
    fs.mkdirSync(path.join(tmp, dept), { recursive: true });

    const name = sutraDirName(
      "般若波羅蜜多心經",
      "T08n0251",
      tmp,
      dept,
      null,
      "唐 玄奘譯",
      undefined,
      1,
    );
    expect(name).toBe("般若波羅蜜多心經_玄奘_1卷");
    expect(isLegacyCbetaIdDirName(name)).toBe(false);
  });

  it("canonical name for 玄奘心经", () => {
    const tmp = path.join("tests", "tmp", "sutra-dir-canonical");
    fs.rmSync(tmp, { recursive: true, force: true });
    const dept = "般若";
    fs.mkdirSync(path.join(tmp, dept, "般若波羅蜜多心經"), { recursive: true });

    expect(
      canonicalSutraDirName("般若波羅蜜多心經", "T08n0251", tmp, dept, "唐 玄奘譯", undefined, 1),
    ).toBe("般若波羅蜜多心經_玄奘_1卷");
  });
});
