/**
 * 辞典真相源审计
 * @author 代长亚
 */
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { countEntriesJsonl, loadDictCatalog, readEntriesJsonl } from "@/lib/dictionaries/io";
import { HAN_DICTIONARY_SOURCES, CORPUS_DICT_SOURCE_CODES } from "@/lib/dictionaries/sources";

const STATS_SOURCES = new Set<string>(CORPUS_DICT_SOURCE_CODES);

function main() {
  const root = resolveDictRoot();
  const catalog = loadDictCatalog(root);
  const codes = (catalog.sources.length
    ? catalog.sources.map((s) => s.code)
    : HAN_DICTIONARY_SOURCES.map((s) => s.code)
  ).filter((c) => STATS_SOURCES.has(c));

  console.log(`Dictionary root: ${root}`);
  console.log(`统计范围：${[...STATS_SOURCES].join(", ")}\n`);
  let total = 0;
  const dupCheck = new Map<string, number>();

  for (const code of codes) {
    const n = countEntriesJsonl(code, root);
    total += n;
    console.log(`${code.padEnd(16)} ${n.toLocaleString()} entries`);
  }

  console.log(`\nTotal: ${total.toLocaleString()}`);

  for (const code of codes) {
    if (countEntriesJsonl(code, root) === 0) continue;
    const entries = readEntriesJsonl(code, root);
    const ids = new Set<string>();
    let dupId = 0;
    const headwords = new Map<string, number>();
    for (const e of entries) {
      if (ids.has(e.id)) dupId++;
      ids.add(e.id);
      headwords.set(e.headword, (headwords.get(e.headword) ?? 0) + 1);
    }
    const dupHw = [...headwords.values()].filter((c) => c > 1).length;
    if (dupId || dupHw) {
      console.log(`  ${code}: duplicate ids=${dupId}, headwords with >1 entry=${dupHw}`);
    }
  }
}

main();
