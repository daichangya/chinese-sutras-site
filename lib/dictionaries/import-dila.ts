/**
 * DILA 辞典 ZIP 下载与 TEI 解析导入
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import {
  parseFormDefEntry,
  parseFormSenseEntry,
  parseMvpEntry,
  parsePentaglotEntry,
  parseSoothillEntry,
  parseTeiEntries,
} from "./dila-tei";
import type { DictionaryEntryRecord } from "./types";
import type { DictionarySourceMeta } from "./types";
import { DILA_DATA_BASE } from "./sources";
import { normalizeDictionaryEntryForStorage } from "@/lib/han/storage-normalize";
import { writeEntriesJsonl } from "./io";
import { isChineseHeadword } from "./zh-filter";

export type ImportDilaOptions = {
  limit?: number;
  dictRoot?: string;
  /** 仅保留中文 headword（默认 true） */
  zhOnly?: boolean;
};

function extractXmlFromZip(zipPath: string): string {
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf-8" });
  const xmlName = listing
    .split("\n")
    .map((l) => l.trim())
    .find((n) => n.endsWith(".xml") && !n.includes("__MACOSX"));
  if (!xmlName) throw new Error(`No XML in zip: ${zipPath}`);
  return execFileSync("unzip", ["-p", zipPath, xmlName], {
    encoding: "utf-8",
    maxBuffer: 128 * 1024 * 1024,
  });
}

const DOWNLOAD_RETRIES = 4;

export async function downloadDilaZip(filename: string): Promise<string> {
  const url = `${DILA_DATA_BASE}/${filename}`;
  const tmp = path.join(os.tmpdir(), `dila-dict-${filename.replace(/[^\w.-]/g, "_")}`);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "JingxinCorpus/1.0" },
        signal: AbortSignal.timeout(300_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error(`response too small (${buf.length} bytes)`);
      fs.writeFileSync(tmp, buf);
      return tmp;
    } catch (err) {
      lastErr = err;
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      if (attempt < DOWNLOAD_RETRIES) {
        const wait = attempt * 2000;
        console.warn(`  download retry ${attempt}/${DOWNLOAD_RETRIES - 1} for ${filename} in ${wait}ms…`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw new Error(`Download failed after ${DOWNLOAD_RETRIES} attempts: ${url} — ${lastErr}`);
}

export function parseEntriesFromXml(
  xml: string,
  meta: DictionarySourceMeta,
  limit = 0,
  zhOnly = true,
): DictionaryEntryRecord[] {
  const raw = parseTeiEntries(xml);
  const out: DictionaryEntryRecord[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (limit > 0 && out.length >= limit) break;
    let rec: DictionaryEntryRecord | null = null;
    switch (meta.parser) {
      case "dila-tei-soothill":
        rec = parseSoothillEntry(raw[i], i, meta.code);
        break;
      case "dila-tei-form-def":
        rec = parseFormDefEntry(raw[i], i, meta.code, meta.lang);
        break;
      case "dila-tei-form-sense":
        rec = parseFormSenseEntry(raw[i], i, meta.code, meta.lang);
        break;
      case "dila-tei-mvp":
        rec = parseMvpEntry(raw[i], i, meta.code);
        break;
      case "dila-tei-pentaglot":
        rec = parsePentaglotEntry(raw[i], i, meta.code);
        break;
      default:
        throw new Error(`Unsupported parser: ${meta.parser}`);
    }
    if (rec) {
      if (meta.license) rec.license = meta.license;
      if (!zhOnly || isChineseHeadword(rec.headword)) {
        if (zhOnly) {
          rec.lang = "zh";
          rec.entry_data = undefined;
        }
        out.push(rec.lang === "zh" ? normalizeDictionaryEntryForStorage(rec) : rec);
      }
    }
  }
  return out;
}

export async function importDilaSource(
  meta: DictionarySourceMeta,
  opts: ImportDilaOptions = {},
): Promise<{ count: number }> {
  if (!meta.zip_filename) throw new Error(`No zip_filename for ${meta.code}`);
  const limit = opts.limit ?? 0;
  const zhOnly = opts.zhOnly !== false;
  let zipPath: string | null = null;
  try {
    zipPath = await downloadDilaZip(meta.zip_filename);
    const xml = extractXmlFromZip(zipPath);
    const records = parseEntriesFromXml(xml, meta, limit, zhOnly);
    writeEntriesJsonl(meta.code, records, opts.dictRoot);
    return { count: records.length };
  } finally {
    if (zipPath && fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  }
}
