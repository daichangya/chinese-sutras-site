import { describe, it, expect } from "vitest";
import { serializeYuanwenJuan, serializeEmptyAuxJuan, serializeJiantiJuan } from "@/lib/corpus-v3/serialize";
import { t2s } from "@/lib/han";
import type { SutraMeta } from "@/lib/corpus-v3/types";
import type { StructureJuan } from "@/lib/cbeta/structure";

const meta: SutraMeta = {
  cbetaId: "T01n0001",
  title: "長阿含經",
  translator: "後秦 佛陀耶舍共竺佛念譯",
  dynasty: "後秦",
  category: "阿含（小乘根本经典）",
  sourceXml: [],
};

const juan: StructureJuan = {
  juanNum: 1,
  label: "第1卷",
  blocks: [
    { kind: "prose", text: "如是我聞：", sectionTitle: "大本經第一", canonicalId: "T01n0001:p0001b12-p0001b12", contentHash: "abc", parserPid: "p000001", seq: 1 },
    { kind: "prose", text: "一時，佛在舍衛國。", canonicalId: "T01n0001:p0001b13-p0001b13", contentHash: "def", parserPid: "p000002", seq: 2 },
  ],
};

describe("corpus-v3 serialize", () => {
  it("renders readable yuanwen without engineering fields", () => {
    const md = serializeYuanwenJuan(meta, juan);
    expect(md).toContain("# 長阿含經 · 第一卷");
    expect(md).toContain("> 後秦 佛陀耶舍共竺佛念譯");
    expect(md).toContain("## 大本經第一");
    expect(md).toContain("如是我聞：");
    expect(md).not.toMatch(/canonical_id/);
    expect(md).not.toMatch(/```yaml/);
    expect(md).not.toMatch(/T01n0001_p/);
  });

  it("renders empty baihua template", () => {
    const md = serializeEmptyAuxJuan(meta, juan, "白话");
    expect(md).toContain("# 長阿含經（白话） · 第1卷");
    expect(md).not.toContain("如是我聞");
  });

  it("renders jianti juan with converted text", () => {
    const convertFn = (t: string) => t2s(t, { backend: "js" }).text;
    const md = serializeJiantiJuan(meta, juan, convertFn);
    expect(md).toContain("# 长阿含经 · 第一卷");
    expect(md).toContain("如是我闻：");
    expect(md).not.toContain("如是我聞");
  });
});
