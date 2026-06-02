/**
 * 审计语料与 zaijia 部类目录的一致性
 * @author jingxin
 *
 * 用法:
 *   npm run corpus:audit-zaijia-section -- --section 03
 *   npm run corpus:audit-zaijia-all
 *   npm run corpus:audit-zaijia-section -- --section 03 --csv out.csv
 *   npm run corpus:audit-zaijia-all -- --fail-on-missing
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import {
  canonDeptFromCbetaId,
  isModernXinbianCorpus,
  lookupTaishoCategory,
  normalizeCbetaId,
} from "@/lib/cbeta/corpus-category";
import type { CorpusCategory } from "@/lib/cbeta/corpus-category";
import {
  categoryFromZaijiaSectionCode,
  getZaijiaMeta,
  listZaijiaIdsBySectionCode,
  listZaijiaSectionCodes,
  loadZaijiaIndexes,
  resetZaijiaCategoryIndexCache,
} from "@/lib/cbeta/zaijia-category";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

resetZaijiaCategoryIndexCache();

const corpusRoot = path.resolve(resolveCorpusRoot());

/** vendor/xml-p5 尚无文件，见 chinese-sutras-md/README.md */
const ZAIJIA_KNOWN_NO_XML = new Set(["A114N1510", "A114N1511"]);

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const auditAll = process.argv.includes("--all");
const sectionCodeArg = argValue("--section");
const sectionLabelArg = argValue("--section-label");
const csvPath = argValue("--csv");
const failOnMissing = process.argv.includes("--fail-on-missing");

if (!auditAll && !sectionCodeArg && !sectionLabelArg) {
  console.error("请指定 --section 03、--section-label 般若部類 或 --all");
  process.exit(2);
}

type CorpusEntry = {
  rel: string;
  cbetaId: string;
  title: string;
  category: string;
  zaijiaSection?: string;
  zaijiaKind?: string;
};

type ExtraReason = "split" | "modern" | "other";
type MisplacedKind = "parserSuspect" | "policy" | "actionable";

export type SectionAuditResult = {
  sectionCode: string;
  sectionLabel: string;
  zaijiaCount: number;
  corpusCount: number;
  corpusIdCount: number;
  missing: { cbetaId: string; topic?: string; kind?: string; expected: string; noXml?: boolean }[];
  extra: (CorpusEntry & { reason: ExtraReason })[];
  misplaced: (CorpusEntry & { expected: string; misplacedKind: MisplacedKind })[];
};

function isDaBoReSplitVariant(id: string): boolean {
  return /^T05N0220[A-Z]$/i.test(id);
}

function corpusCoversZaijiaId(zaijiaId: string, corpusIds: Set<string>): boolean {
  if (corpusIds.has(zaijiaId)) return true;
  if (zaijiaId === "T05N0220") {
    return [...corpusIds].some((id) => isDaBoReSplitVariant(id));
  }
  return false;
}

function classifyExtra(cbetaId: string, title: string): ExtraReason {
  if (isDaBoReSplitVariant(cbetaId)) return "split";
  if (isModernXinbianCorpus(cbetaId, title)) return "modern";
  return "other";
}

function sectionLabelMatches(metaLabel: string | undefined, target: string): boolean {
  if (!metaLabel) return false;
  return metaLabel === target || metaLabel.replace(/\s/g, "") === target.replace(/\s/g, "");
}

function classifyMisplaced(
  entry: CorpusEntry,
  expected: CorpusCategory,
  zm: ReturnType<typeof getZaijiaMeta>,
): MisplacedKind {
  const id = entry.cbetaId;
  const taisho = lookupTaishoCategory(id);

  /** T85 古逸卷仍 sutra_sch→敦煌，优先于 zaijia 般若/法华主题 */
  if (
    (id.startsWith("T85") || taisho === "敦煌写本（敦煌出土古写经）") &&
    entry.category === "敦煌写本（敦煌出土古写经）" &&
    expected !== entry.category
  ) {
    return "policy";
  }

  if (
    zm?.kind === "经" &&
    entry.category === "论集（杂论、通论）" &&
    expected !== "论集（杂论、通论）" &&
    /论|釋论|释论|釋論/.test(entry.title)
  ) {
    return "policy";
  }

  return "actionable";
}

export function auditZaijiaSection(
  sectionCode: string,
  sectionLabelOverride?: string,
): SectionAuditResult {
  const { categoryById, metaById } = loadZaijiaIndexes();
  const zaijiaIds = listZaijiaIdsBySectionCode(sectionCode);
  const zaijiaIdSet = new Set(zaijiaIds);
  const sectionLabel =
    sectionLabelOverride ?? metaById.get(zaijiaIds[0] ?? "")?.sectionLabel ?? sectionCode;
  const sectionCategory =
    categoryFromZaijiaSectionCode(sectionCode) ?? categoryById.get(zaijiaIds[0] ?? "") ?? null;

  const corpusEntries: CorpusEntry[] = [];
  const corpusIds = new Set<string>();

  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const sutraDir = path.dirname(metaPath);
    const rel = path.relative(corpusRoot, sutraDir).replace(/\\/g, "/");
    const raw = YAML.parse(fs.readFileSync(metaPath, "utf-8")) as Record<string, unknown>;
    const cbetaId = normalizeCbetaId(String(raw.cbeta_id ?? "").trim());
    const title = String(raw.title ?? "").trim();
    if (!cbetaId) continue;

    const zj = raw.zaijia as { section?: string; kind?: string } | undefined;
    const zm = getZaijiaMeta(cbetaId);
    const matchesSection =
      zm?.sectionCode === sectionCode ||
      sectionLabelMatches(zj?.section, sectionLabel) ||
      zaijiaIdSet.has(cbetaId);

    if (!matchesSection) continue;

    corpusEntries.push({
      rel,
      cbetaId,
      title,
      category: String(raw.category ?? "").trim(),
      zaijiaSection: zj?.section,
      zaijiaKind: zj?.kind,
    });
    corpusIds.add(cbetaId);
  }

  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const raw = YAML.parse(fs.readFileSync(metaPath, "utf-8")) as Record<string, unknown>;
    const cbetaId = normalizeCbetaId(String(raw.cbeta_id ?? "").trim());
    if (!cbetaId) continue;
    const zm = getZaijiaMeta(cbetaId);
    if (zm?.sectionCode === sectionCode) corpusIds.add(cbetaId);
    if (sectionCategory && String(raw.category ?? "").trim() === sectionCategory) {
      corpusIds.add(cbetaId);
    }
  }

  const missing: SectionAuditResult["missing"] = [];
  for (const id of zaijiaIds.sort()) {
    if (!corpusCoversZaijiaId(id, corpusIds)) {
      const zm = getZaijiaMeta(id);
      const noXml = ZAIJIA_KNOWN_NO_XML.has(id.toUpperCase());
      missing.push({
        cbetaId: id,
        topic: zm?.topicLabel,
        kind: zm?.kind,
        expected: categoryById.get(id) ?? canonDeptFromCbetaId(id),
        ...(noXml ? { noXml: true as const } : {}),
      });
    }
  }

  const extra: SectionAuditResult["extra"] = [];
  for (const e of corpusEntries) {
    if (!zaijiaIdSet.has(e.cbetaId)) {
      extra.push({ ...e, reason: classifyExtra(e.cbetaId, e.title) });
    }
  }

  const misplaced: SectionAuditResult["misplaced"] = [];
  for (const e of corpusEntries) {
    const expected = canonDeptFromCbetaId(e.cbetaId, e.title);
    if (e.category && expected && e.category !== expected) {
      const zm = getZaijiaMeta(e.cbetaId);
      misplaced.push({
        ...e,
        expected,
        misplacedKind: classifyMisplaced(e, expected, zm),
      });
    }
  }

  return {
    sectionCode,
    sectionLabel,
    zaijiaCount: zaijiaIds.length,
    corpusCount: corpusEntries.length,
    corpusIdCount: corpusIds.size,
    missing,
    extra,
    misplaced,
  };
}

function printSectionReport(result: SectionAuditResult, verbose: boolean): void {
  const { sectionCode, sectionLabel } = result;
  const parserN = result.misplaced.filter((m) => m.misplacedKind === "parserSuspect").length;
  const policyN = result.misplaced.filter((m) => m.misplacedKind === "policy").length;
  const actionableN = result.misplaced.filter((m) => m.misplacedKind === "actionable").length;

  console.log(
    `${sectionCode} ${sectionLabel}: zaijia=${result.zaijiaCount} corpus=${result.corpusCount} missing=${result.missing.length} extra=${result.extra.length} misplaced=${result.misplaced.length} (parser=${parserN} policy=${policyN} actionable=${actionableN})`,
  );

  if (!verbose) return;

  if (result.missing.length) {
    console.log("\n## missing（zaijia 有、语料无）");
    for (const m of result.missing.slice(0, 40)) {
      console.log(`  ${m.cbetaId}  ${m.kind ?? ""}  ${m.topic ?? ""}  → ${m.expected}`);
    }
  }
  if (result.extra.length) {
    console.log("\n## extra（语料有、zaijia 无）");
    for (const e of result.extra.slice(0, 15)) {
      console.log(`  ${e.cbetaId} (${e.reason})  ${e.rel}`);
    }
  }
  const actionable = result.misplaced.filter((m) => m.misplacedKind === "actionable");
  if (actionable.length) {
    console.log("\n## misplaced actionable");
    for (const m of actionable.slice(0, 20)) {
      console.log(`  ${m.cbetaId}  ${m.category} → ${m.expected}`);
      console.log(`    ${m.rel}`);
    }
  }
}

function writeCsv(results: SectionAuditResult[], outPath: string): void {
  const lines: string[] = [
    "section,type,cbeta_id,title,category,expected,misplaced_kind,reason,topic,kind,rel",
  ];
  for (const r of results) {
    for (const m of r.missing) {
      lines.push(
        `${r.sectionCode},missing,${m.cbetaId},,,${m.expected},,,${m.topic ?? ""},${m.kind ?? ""},`,
      );
    }
    for (const e of r.extra) {
      lines.push(
        `${r.sectionCode},extra,${e.cbetaId},"${e.title.replace(/"/g, '""')}",${e.category},,,${e.reason},,,${e.rel}`,
      );
    }
    for (const m of r.misplaced) {
      lines.push(
        `${r.sectionCode},misplaced,${m.cbetaId},"${m.title.replace(/"/g, '""')}",${m.category},${m.expected},${m.misplacedKind},,,,"${m.rel}"`,
      );
    }
  }
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  console.log(`\n已写入 ${outPath}`);
}

const sections = auditAll
  ? listZaijiaSectionCodes()
  : sectionCodeArg
    ? [sectionCodeArg]
    : [];

const results: SectionAuditResult[] = [];
if (auditAll) {
  for (const code of sections) {
    results.push(auditZaijiaSection(code));
  }
  console.log("# zaijia 全藏部类审计\n");
  console.log("section\t部类\tzaijia\tmissing\tmisplaced\tparser\tpolicy\tactionable");
  let totalMissing = 0;
  let totalMissingBlocking = 0;
  let totalActionable = 0;
  for (const r of results) {
    const parserN = r.misplaced.filter((m) => m.misplacedKind === "parserSuspect").length;
    const policyN = r.misplaced.filter((m) => m.misplacedKind === "policy").length;
    const actionableN = r.misplaced.filter((m) => m.misplacedKind === "actionable").length;
    totalMissing += r.missing.length;
    totalMissingBlocking += r.missing.filter((m) => !m.noXml).length;
    totalActionable += actionableN;
    console.log(
      `${r.sectionCode}\t${r.sectionLabel}\t${r.zaijiaCount}\t${r.missing.length}\t${r.misplaced.length}\t${parserN}\t${policyN}\t${actionableN}`,
    );
  }
  const noXmlN = totalMissing - totalMissingBlocking;
  console.log(
    `\n合计 missing=${totalMissing} (blocking=${totalMissingBlocking}${noXmlN ? `, no_xml=${noXmlN}` : ""}) actionable_misplaced=${totalActionable}`,
  );
  if (csvPath) writeCsv(results, csvPath);
  process.exit(failOnMissing && totalMissingBlocking > 0 ? 1 : 0);
} else if (sectionLabelArg) {
  const { metaById } = loadZaijiaIndexes();
  const label = sectionLabelArg.replace(/\s/g, "");
  const code = [...metaById.values()].find(
    (m) => m.sectionLabel.replace(/\s/g, "") === label || m.sectionLabel === sectionLabelArg,
  )?.sectionCode;
  if (!code) {
    console.error(`未找到 section: ${sectionLabelArg}`);
    process.exit(2);
  }
  const r = auditZaijiaSection(code, sectionLabelArg);
  results.push(r);
  printSectionReport(r, true);
  if (csvPath) writeCsv(results, csvPath);
  process.exit(r.missing.length > 0 ? 1 : 0);
} else {
  const r = auditZaijiaSection(sectionCodeArg!);
  results.push(r);
  printSectionReport(r, true);
  if (csvPath) writeCsv(results, csvPath);
  process.exit(r.missing.length > 0 ? 1 : 0);
}
