/**
 * KG-2：从 corpus meta.yaml 抽取经目与译者关系
 * @author 代长亚
 */
import { resolveCorpusRoot } from "@/lib/corpus-v3/paths";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { extractKgFromCorpus } from "@/lib/kg/extract-corpus";
import { readEntitiesJsonl, readRelationsJsonl, writeEntitiesJsonl, writeRelationsJsonl } from "@/lib/kg/io";
import { mergeKgEntities, mergeKgRelations } from "@/lib/kg/extract-text-relations";

function main() {
  const corpusRoot = resolveCorpusRoot();
  const kgRoot = resolveKgRoot();
  const existingEntities = readEntitiesJsonl(kgRoot);
  const existingRelations = readRelationsJsonl(kgRoot);
  const seedPersons = existingEntities.filter((e) => e.entity_type === "person");

  const { entities: extracted, relations } = extractKgFromCorpus(corpusRoot, seedPersons);
  const keptRelations = existingRelations.filter(
    (r) => !(r.source === "corpus_meta" && r.predicate === "translated"),
  );
  writeEntitiesJsonl(mergeKgEntities(existingEntities, extracted), kgRoot);
  writeRelationsJsonl(mergeKgRelations(keptRelations, relations), kgRoot);
  console.log(
    `KG-2: +${extracted.length} entities, +${relations.length} relations (corpus: ${corpusRoot})`,
  );
}

main();
