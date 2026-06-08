/**
 * 段落身份侧车 _index/blocks.jsonl
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import type { StructureBlock, StructureJuan } from "@/lib/cbeta/structure";

export type BlockIndexEntry = {
  canonical_id: string;
  start_ref: string | null;
  end_ref: string | null;
  content_hash: string;
  parser_pid: string;
  juan_num: number;
  kind: "prose" | "verse";
};

export function blocksIndexPath(sutraRoot: string): string {
  return path.join(sutraRoot, "_index", "blocks.jsonl");
}

export function writeBlocksIndex(sutraRoot: string, juans: StructureJuan[]): void {
  const indexDir = path.join(sutraRoot, "_index");
  fs.mkdirSync(indexDir, { recursive: true });
  const lines: string[] = [];
  for (const juan of juans) {
    const juanNum = juan.juanNum > 0 ? juan.juanNum : 0;
    for (const b of juan.blocks) {
      const entry: BlockIndexEntry = {
        canonical_id: b.canonicalId,
        start_ref: b.startRef ?? null,
        end_ref: b.endRef ?? null,
        content_hash: b.contentHash,
        parser_pid: b.parserPid,
        juan_num: juanNum,
        kind: b.kind,
      };
      lines.push(JSON.stringify(entry));
    }
  }
  fs.writeFileSync(blocksIndexPath(sutraRoot), lines.join("\n") + (lines.length ? "\n" : ""), "utf-8");
}

export function loadBlocksIndex(sutraRoot: string): BlockIndexEntry[] {
  const file = blocksIndexPath(sutraRoot);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8");
  const entries: BlockIndexEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    entries.push(JSON.parse(t) as BlockIndexEntry);
  }
  return entries;
}

export function structureBlocksFromIndex(entries: BlockIndexEntry[]): StructureBlock[] {
  return entries.map((e, i) => ({
    kind: e.kind,
    text: "",
    startRef: e.start_ref ?? undefined,
    endRef: e.end_ref ?? undefined,
    canonicalId: e.canonical_id,
    contentHash: e.content_hash,
    parserPid: e.parser_pid || `p${String(i + 1).padStart(6, "0")}`,
    seq: i + 1,
  }));
}

export function juansFromIndexEntries(entries: BlockIndexEntry[]): StructureJuan[] {
  const byJuan = new Map<number, BlockIndexEntry[]>();
  for (const e of entries) {
    const j = e.juan_num;
    if (!byJuan.has(j)) byJuan.set(j, []);
    byJuan.get(j)!.push(e);
  }
  const nums = [...byJuan.keys()].sort((a, b) => a - b);
  const hasRealJuan = nums.some((n) => n > 0);
  return nums.map((juanNum) => ({
    juanNum,
    label: hasRealJuan && juanNum > 0 ? `第${juanNum}卷` : "全文",
    blocks: structureBlocksFromIndex(byJuan.get(juanNum)!).map((b, idx) => {
      const e = byJuan.get(juanNum)![idx]!;
      return { ...b, kind: e.kind };
    }),
  }));
}
