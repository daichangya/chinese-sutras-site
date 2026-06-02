import { describe, it, expect } from "vitest";
import { convertReadableMarkdownToPinyin } from "@/lib/pinyin/markdown";
import { parseReadableParagraphs } from "@/lib/corpus-v3/markdown";

describe("pinyin readable markdown", () => {
  it("preserves headings and converts body to spaced pinyin", () => {
    const md = `# 心经

---

## 1

觀自在菩薩行深般若波羅蜜多時。
`;
    const out = convertReadableMarkdownToPinyin(md);
    expect(out).toContain("# 心经");
    expect(out).toContain("---");
    expect(out).toContain("## 1");
    const paras = parseReadableParagraphs(out);
    expect(paras[0]).toMatch(/guān zì zài/);
    expect(paras[0]).toMatch(/pú sà/);
    expect(paras[0]).not.toMatch(/觀/);
  });
});
