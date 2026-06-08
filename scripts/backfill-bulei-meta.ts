/**
 * 为已有 corpus 补写 meta.yaml 的 bulei（不移动目录）
 * @author 代长亚
 */
import fs from "fs";
import { canonDeptFromCbetaId } from "@/lib/cbeta/corpus-category";
import {
  findSutraMetaFiles,
  loadSutraMeta,
  writeSutraMeta,
  buleiFieldsForCbetaId,
} from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const dryRun = process.argv.includes("--dry-run");
const onlyFilter = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : undefined;

let updated = 0;
let skipped = 0;

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

  const bulei = buleiFieldsForCbetaId(meta.cbetaId);
  const category = canonDeptFromCbetaId(meta.cbetaId, meta.title);

  const needsCategory = meta.category !== category;
  const needsBulei =
    !!bulei &&
    (meta.bulei?.section !== bulei.section ||
      meta.bulei?.group !== bulei.group ||
      meta.bulei?.section_code !== bulei.section_code ||
      meta.bulei?.kind !== bulei.kind ||
      meta.bulei?.source !== bulei.source);

  if (!needsCategory && !needsBulei) {
    skipped += 1;
    continue;
  }

  if (dryRun) {
    console.log(
      `${rel}: category=${needsCategory ? category : "-"} bulei=${bulei?.source ?? "none"}`,
    );
  } else {
    writeSutraMeta(metaPath, { ...meta, category, bulei });
  }
  updated += 1;
}

console.log(`Done: updated=${updated} skipped=${skipped} dryRun=${dryRun}`);
