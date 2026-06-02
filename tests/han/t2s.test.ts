import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { t2s, s2t, detectScript } from "@/lib/han/converter";
import * as cliBackend from "@/lib/han/cli-backend";
import { convertReadableMarkdown } from "@/lib/han/markdown";
import { parseReadableParagraphs } from "@/lib/corpus-v3/markdown";

describe("han t2s", () => {
  it("converts Heart Sutra opening", () => {
    const input = "般若波羅蜜多心經，觀自在菩薩，行深般若波羅蜜多時";
    const { text } = t2s(input, { backend: "js" });
    expect(text).toBe("般若波罗蜜多心经，观自在菩萨，行深般若波罗蜜多时");
  });

  it("protects 涅槃", () => {
    const { text } = t2s("入涅槃界", { backend: "js" });
    expect(text).toContain("涅槃");
    expect(text).not.toContain("涅盘");
  });

  it("handles cbeta phrase 目乾連", () => {
    const { text } = t2s("目乾連", { backend: "js" });
    expect(text).toBe("目乾连");
  });

  it("handles cbeta phrase 神祇", () => {
    const { text } = t2s("神祇", { backend: "js" });
    expect(text).toBe("神祇");
  });

  it("handles cbeta phrase 祇樹", () => {
    const { text } = t2s("祇樹給孤獨園", { backend: "js" });
    expect(text).toContain("祇树");
  });

  it("does not corrupt digit 一 in headings", () => {
    const { text } = t2s("第一卷\n## （一）愚人食鹽喻", { backend: "js" });
    expect(text).toContain("第一卷");
    expect(text).toContain("（一）愚人食盐喻");
    expect(text).not.toMatch(/第口卷|（口）/);
  });

  it("preserves mantra characters from manual dict", () => {
    const mantra = "唵嘛呢叭咪吽";
    const { text } = t2s(mantra, { backend: "js" });
    expect(text).toBe(mantra);
  });

  it("strips CBETA inline markers when normalize=true", () => {
    const { text } = t2s("如是我聞[1]", { backend: "js", normalize: true });
    expect(text).not.toContain("[1]");
    expect(text).toContain("闻");
  });

  it("detectScript identifies simplified", () => {
    expect(detectScript("学经")).toBe("simplified");
  });

  it("detectScript identifies traditional", () => {
    expect(detectScript("觀自在菩薩")).toBe("traditional");
  });

  it("s2t round-trip preserves key buddhist terms", () => {
    const original = "般若波羅蜜多心經";
    const simplified = t2s(original, { backend: "js" }).text;
    const back = s2t(simplified, { backend: "js" }).text;
    expect(back).toContain("般若");
  });
});

describe("han cli fallback", () => {
  beforeEach(() => {
    cliBackend.resetCliAvailabilityCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cliBackend.resetCliAvailabilityCache();
  });

  it("falls back to js when cli unavailable", () => {
    vi.spyOn(cliBackend, "isCliAvailable").mockReturnValue(false);
    const { text, backend } = t2s("觀自在", { backend: "auto" });
    expect(backend).toBe("js");
    expect(text).toBe("观自在");
  });
});

describe("convertReadableMarkdown", () => {
  const md = `# 般若心經

> 唐 玄奘譯

---

## 序分

觀自在菩薩行深般若波羅蜜多時。
`;

  it("preserves structure and converts text", () => {
    const out = convertReadableMarkdown(md, (t) => t2s(t, { backend: "js" }).text);
    expect(out).toContain("# 般若心经");
    expect(out).toContain("> 唐 玄奘译");
    expect(out).toContain("## 序分");
    expect(out).toContain("观自在菩萨");
    const paras = parseReadableParagraphs(out);
    expect(paras.length).toBe(1);
    expect(paras[0]).toContain("观自在");
  });
});

describe("isCliAvailable", () => {
  it("returns boolean without throwing", () => {
    expect(typeof cliBackend.isCliAvailable()).toBe("boolean");
  });
});
