/**
 * NTI 汉英佛学辞典 TSV 导入
 * @author 代长亚
 */
import type { DictionaryEntryRecord } from "./types";
import { writeEntriesJsonl } from "./io";

const NTI_TSV_URL =
  "https://raw.githubusercontent.com/alexamies/buddhist-dictionary/master/data/dictionary/cnotes_zh_en_dict.tsv";

export async function importNtiTsv(opts: { limit?: number; dictRoot?: string } = {}): Promise<{ count: number }> {
  const limit = opts.limit ?? 0;
  const res = await fetch(NTI_TSV_URL, { headers: { "User-Agent": "JingxinCorpus/1.0" } });
  if (!res.ok) throw new Error(`NTI download failed: ${res.status}`);
  const text = await res.text();
  const records: DictionaryEntryRecord[] = [];
  for (const line of text.split("\n")) {
    if (limit > 0 && records.length >= limit) break;
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const cols = t.split("\t");
    if (cols.length < 2) continue;
    const headword = cols[0]!.trim();
    const definition = cols.slice(1).join(" ").trim();
    if (!headword || !definition) continue;
    const reading = cols[2]?.trim();
    records.push({
      id: `nti:${records.length}`,
      source: "nti",
      headword,
      reading: reading || undefined,
      definition,
      lang: "zh",
      license: "CC-BY-SA-3.0",
      entry_data: cols[3] ? { pos: cols[3] } : undefined,
    });
  }
  writeEntriesJsonl("nti", records, opts.dictRoot);
  return { count: records.length };
}
