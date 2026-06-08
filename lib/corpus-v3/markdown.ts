/**
 * Corpus V3 可读 Markdown 解析（导入对齐用）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

/** 从原文/白話卷文件中按空行切分段落（跳过标题、引用、分隔线、品目） */
export function parseReadableParagraphs(md: string): string[] {
  const lines = md.split(/\r?\n/);
  const paragraphs: string[] = [];
  let buf: string[] = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) paragraphs.push(text);
    buf = [];
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    if (t.startsWith("#")) continue;
    if (t.startsWith(">")) continue;
    if (t === "---") continue;
    buf.push(line);
  }
  flush();
  return paragraphs;
}

export function readMdIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function listJuanMdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.join(dir, f));
}

/** 按文件名排序对齐卷序（第001卷.md / 全文.md） */
export function juanSortKey(filename: string): number {
  if (filename.includes("全文")) return 0;
  const m = filename.match(/第(\d+)卷/);
  return m ? parseInt(m[1], 10) : 9999;
}
