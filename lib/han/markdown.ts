/**
 * 可读 Markdown 繁简转换（保留标题/引用/分隔线结构）
 * @author 代长亚
 */

/** 转换 corpus 原文/简体 Markdown，只转换正文与标题文字 */
export function convertReadableMarkdown(md: string, convertFn: (t: string) => string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let buf: string[] = [];

  const flushBuf = () => {
    const text = buf.join("\n").trim();
    if (text) out.push(convertFn(text));
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
      const m = line.match(/^(#+\s*)(.+)$/);
      out.push(m ? `${m[1]}${convertFn(m[2]!)}` : convertFn(line));
      continue;
    }
    if (t.startsWith(">")) {
      flushBuf();
      const inner = t.slice(1).trim();
      out.push(`> ${convertFn(inner)}`);
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
