/**
 * 可读 Markdown 拼音转换（保留标题/引用/分隔线，正文转为空格分隔拼音）
 * @author jingxin
 */
import { segmentParagraph, toPlainText } from "./segment";
import type { PinyinScript } from "./types";

/** 将 corpus 原文卷转为可读拼音卷（结构同 原文/简体） */
export function convertReadableMarkdownToPinyin(
  md: string,
  script: PinyinScript = "traditional",
): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let buf: string[] = [];

  const flushBuf = () => {
    const text = buf.join("\n").trim();
    if (text) {
      const readings = segmentParagraph(text, { script });
      out.push(toPlainText(readings));
    }
    buf = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushBuf();
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (t.startsWith("#")) {
      flushBuf();
      out.push(line);
      continue;
    }
    if (t.startsWith(">")) {
      flushBuf();
      out.push(line);
      continue;
    }
    if (t === "---") {
      flushBuf();
      out.push("---");
      continue;
    }
    buf.push(line);
  }
  flushBuf();

  return out.join("\n").trimEnd() + "\n";
}
