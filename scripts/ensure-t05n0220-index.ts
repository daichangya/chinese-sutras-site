/**
 * 为大般若 T05n0220 创建聚合目录索引（正文仍由 T05n0220a 等分卷承载）
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { zaijiaFieldsForCbetaId } from "@/lib/corpus-v3/meta";
import { writeSutraMeta } from "@/lib/corpus-v3/meta";
import type { SutraMeta } from "@/lib/corpus-v3/types";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const dryRun = process.argv.includes("--dry-run");

const dir = path.join(corpusRoot, "般若", "大般若波罗蜜多经_唐玄奘译_600卷");
const metaPath = path.join(dir, "meta.yaml");

if (fs.existsSync(metaPath)) {
  console.log("已存在:", metaPath);
  process.exit(0);
}

const childDirs = fs
  .readdirSync(path.join(corpusRoot, "般若"), { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name.includes("大般若波罗蜜多经"))
  .map((e) => e.name);

const meta: SutraMeta = {
  cbetaId: "T05n0220",
  title: "大般若波罗蜜多经",
  translator: "唐 玄奘译",
  dynasty: "唐",
  category: "般若",
  zaijia: zaijiaFieldsForCbetaId("T05n0220"),
  juanCount: 600,
  sourceXml: [],
  description: `整经目录索引；正文分卷见：${childDirs.join("、")}`,
};

if (dryRun) {
  console.log("dry-run:", JSON.stringify(meta, null, 2));
  process.exit(0);
}

writeSutraMeta(metaPath, meta);
console.log("已写入:", metaPath);
