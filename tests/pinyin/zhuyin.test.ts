import { describe, it, expect } from "vitest";
import { zhuyinToPinyin, zhuyinToPinyinAll } from "@/lib/pinyin/zhuyin";

describe("zhuyin", () => {
  it("converts ㄧˇ to yǐ", () => {
    expect(zhuyinToPinyin("注音：ㄧˇ")).toBe("yǐ");
  });

  it("converts ㄔㄨㄢ- to chuān", () => {
    expect(zhuyinToPinyin("注音：ㄔㄨㄢ-")).toBe("chuān");
  });

  it("takes first alternative reading", () => {
    const all = zhuyinToPinyinAll("ㄉㄧㄥ-,ㄓㄥ-");
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all[0]).toBe("dīng");
  });

  it("returns null for empty", () => {
    expect(zhuyinToPinyin("")).toBeNull();
  });
});
