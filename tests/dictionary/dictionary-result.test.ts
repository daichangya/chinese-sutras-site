/**
 * 字典组件单元测试
 * @author 代长亚
 */
import { describe, it, expect } from "vitest";

describe("dictionary source labels", () => {
  const SOURCE_LABELS: Record<string, string> = {
    dingfubao: "丁福保佛学大辞典",
    nanshanlu: "南山律学辞典",
    soothill: "中英佛学辞典",
    nti: "NTI 汉英佛学辞典",
    dila: "DILA 佛学辞典",
  };

  function getSourceLabel(code: string): string {
    return SOURCE_LABELS[code] ?? code;
  }

  it("maps dingfubao to 丁福保佛学大辞典", () => {
    expect(getSourceLabel("dingfubao")).toBe("丁福保佛学大辞典");
  });

  it("maps nanshanlu to 南山律学辞典", () => {
    expect(getSourceLabel("nanshanlu")).toBe("南山律学辞典");
  });

  it("maps soothill to 中英佛学辞典", () => {
    expect(getSourceLabel("soothill")).toBe("中英佛学辞典");
  });

  it("falls back to raw code for unknown sources", () => {
    expect(getSourceLabel("unknown_src")).toBe("unknown_src");
  });
});

describe("dictionary reading label", () => {
  type DictEntry = {
    id: string;
    source: string;
    headword: string;
    definition: string;
    reading: string | null;
    lang: string;
  };

  function getReadingLabel(entry: DictEntry): string | null {
    if (!entry.reading) return null;
    const lang = entry.lang?.toLowerCase();
    if (lang === "zh" || lang === "zh-hans" || lang === "zh-hant") {
      return `读音：${entry.reading}`;
    }
    return entry.reading;
  }

  it("formats Chinese reading label", () => {
    const entry: DictEntry = {
      id: "t:1",
      source: "dingfubao",
      headword: "般若",
      definition: "智慧",
      reading: "bō rě",
      lang: "zh",
    };
    expect(getReadingLabel(entry)).toBe("读音：bō rě");
  });

  it("returns raw reading for non-zh", () => {
    const entry: DictEntry = {
      id: "t:2",
      source: "nti",
      headword: "prajna",
      definition: "wisdom",
      reading: "bōrě",
      lang: "en",
    };
    expect(getReadingLabel(entry)).toBe("bōrě");
  });

  it("returns null when no reading", () => {
    const entry: DictEntry = {
      id: "t:3",
      source: "dingfubao",
      headword: "空",
      definition: "空性",
      reading: null,
      lang: "zh",
    };
    expect(getReadingLabel(entry)).toBeNull();
  });
});

describe("history dedup logic", () => {
  it("deduplicates and moves to front", () => {
    const applyHistory = (history: string[], query: string, max: number) => {
      return [query, ...history.filter((h) => h !== query)].slice(0, max);
    };

    const result = applyHistory(["菩提", "般若"], "菩提", 10);
    expect(result).toEqual(["菩提", "般若"]);
  });

  it("caps to max items", () => {
    const applyHistory = (history: string[], query: string, max: number) => {
      return [query, ...history.filter((h) => h !== query)].slice(0, max);
    };

    const items = Array.from({ length: 15 }, (_, i) => `term-${i}`);
    let result: string[] = [];
    for (const item of items) {
      result = applyHistory(result, item, 10);
    }
    expect(result.length).toBe(10);
    expect(result[0]).toBe("term-14");
  });

  it("adds new item at front", () => {
    const applyHistory = (history: string[], query: string, max: number) => {
      return [query, ...history.filter((h) => h !== query)].slice(0, max);
    };

    const result = applyHistory(["菩提"], "涅槃", 10);
    expect(result).toEqual(["涅槃", "菩提"]);
  });
});
