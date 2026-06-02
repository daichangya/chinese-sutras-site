/**
 * 为已有 corpus 补写 meta.yaml 的 zaijia 子类（不移动目录）
 * @author jingxin
 */
import fs from "fs";
import {
  findSutraMetaFiles,
  loadSutraMeta,
  writeSutraMeta,
  zaijiaFieldsForCbetaId,
} from "@/lib/corpus-v3/meta";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const dryRun = process.argv.includes("--dry-run");
const onlyFilter = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : undefined;

let updated = 0;
let skipped = 0;
let missing = 0;

for (const metaPath of findSutraMetaFiles(corpusRoot)) {
  if (!fs.existsSync(metaPath)) continue;
  const rel = metaPath.replace(`${corpusRoot}/`, "").replace(/\\/g, "/");
  if (onlyFilter && !rel.includes(onlyFilter)) {
    skipped += 1;
    continue;
  }

  let meta;
  try {
    meta = loadSutraMeta(metaPath);
  } catch {
    continue;
  }

  const zaijia = zaijiaFieldsForCbetaId(meta.cbetaId);
  if (!zaijia) {
    missing += 1;
    continue;
  }

  const same =
    meta.zaijia?.section === zaijia.section &&
    meta.zaijia?.topic === zaijia.topic &&
    meta.zaijia?.kind === zaijia.kind;
  if (same) {
    skipped += 1;
    continue;
  }

  if (dryRun) {
    console.log(`${rel}: zaijia ${JSON.stringify(zaijia)}`);
  } else {
    writeSutraMeta(metaPath, { ...meta, zaijia });
  }
  updated += 1;
}

console.log(
  `Done: updated=${updated} skipped=${skipped} no_zaijia=${missing} dryRun=${dryRun}`,
);
