/**
 * KG-3：题名规则经间关系（parallel_to）
 * @author 代长亚
 */
import { resolveCorpusRoot } from "@/lib/corpus-v3/paths";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { extractTextRelationsFromCorpus, mergeKgRelations } from "@/lib/kg/extract-text-relations";
import { readRelationsJsonl, writeRelationsJsonl } from "@/lib/kg/io";

function parseLimit(argv: string[]): number {
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) return parseInt(argv[++i]!, 10) || 0;
  }
  return 0;
}

function main() {
  const limit = parseLimit(process.argv);
  const corpusRoot = resolveCorpusRoot();
  const kgRoot = resolveKgRoot();
  let relations = extractTextRelationsFromCorpus(corpusRoot);
  if (limit > 0) relations = relations.slice(0, limit);
  const existing = readRelationsJsonl(kgRoot);
  writeRelationsJsonl(mergeKgRelations(existing, relations), kgRoot);
  console.log(`KG-3: +${relations.length} parallel_to relations`);
}

main();
