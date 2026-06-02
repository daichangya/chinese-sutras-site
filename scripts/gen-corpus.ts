/**
 * 从 CBETA TEI XML 生成 Corpus V3（文库式 Markdown，写入 chinese-sutras-md/）
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import { resolveCbetaXmlPath } from "@/lib/cbeta/resolve-path";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { buildCorpusResumeIndex } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const corpusRoot = resolveCorpusRoot();

const cleanStale = process.argv.includes("--clean-stale");
const withT2s = process.argv.includes("--t2s");
const withPinyin = process.argv.includes("--pinyin");
const resume = process.argv.includes("--resume");
const noStripPreface = process.argv.includes("--no-strip-preface");
const fixturesOnly = process.argv.includes("--fixtures");
const limit = (() => {
  const i = process.argv.indexOf("--limit");
  if (i < 0) return undefined;
  const n = parseInt(process.argv[i + 1] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
})();

const cbetaIdFilter = (() => {
  const i = process.argv.indexOf("--cbeta-id");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

function resolveXmlPath(cbetaId: string): string | null {
  if (fixturesOnly) {
    const fixture = path.join("tests/fixtures", `${cbetaId}.xml`);
    return fs.existsSync(fixture) ? fixture : null;
  }
  return resolveCbetaXmlPath(cbetaId, xmlRoot);
}

let discovered = discoverCbetaXmlFiles(xmlRoot);
if (cbetaIdFilter) {
  discovered = discovered.filter((d) => d.cbetaId === cbetaIdFilter);
}
if (limit) discovered = discovered.slice(0, limit);

const xmlTotal = discovered.length;
let juanFiles = 0;
let blocks = 0;
let skipped = 0;
let errors = 0;

const resumeIndex = resume ? buildCorpusResumeIndex(corpusRoot) : null;
if (resume && resumeIndex) {
  const before = discovered.length;
  discovered = discovered.filter((d) => !resumeIndex.generatedIds.has(d.cbetaId));
  skipped = before - discovered.length;
  console.log(
    `Resume: ${resumeIndex.generatedIds.size} already in corpus, ${discovered.length} to generate (${skipped} skipped upfront)`,
  );
}

const total = discovered.length;
const t0 = Date.now();

for (let i = 0; i < discovered.length; i++) {
  const d = discovered[i]!;
  const xmlPath = resolveXmlPath(d.cbetaId) ?? d.absolutePath;
  if (!xmlPath) continue;
  try {
    const result = generateCorpusV3FromXml({
      cbetaId: d.cbetaId,
      xmlPath,
      xmlRoot,
      corpusRoot,
      stripPreface: !noStripPreface,
      cleanStale,
      knownSutraDir: resumeIndex?.dirByCbetaId.get(d.cbetaId) ?? null,
      t2s: withT2s,
    });
    juanFiles += result.juanFiles.length;
    blocks += result.blockCount;
    if (result.blockCount > 0) {
      console.log(`Generated ${d.cbetaId}: juans=${result.juanFiles.length} blocks=${result.blockCount}`);
      resumeIndex?.generatedIds.add(d.cbetaId);
      resumeIndex?.dirByCbetaId.set(d.cbetaId, path.basename(result.sutraDir));
    }
  } catch (e) {
    errors += 1;
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`ERROR ${d.cbetaId}: ${msg}`);
  }
  if ((i + 1) % 10 === 0 || i + 1 === total) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`Progress ${i + 1}/${total} blocks=${blocks} errors=${errors} elapsed=${elapsed}s`);
  }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(
  `Done: xmlTotal=${xmlTotal} generated=${total} juanFiles=${juanFiles} blocks=${blocks} skipped=${skipped} errors=${errors} elapsed=${elapsed}s corpusRoot=${corpusRoot}`,
);

if (withPinyin && blocks > 0) {
  const args = ["run", "corpus:pinyin", "--"];
  if (cbetaIdFilter) args.push("--cbeta-id", cbetaIdFilter);
  console.log("Running corpus:pinyin...");
  execSync(`npm ${args.join(" ")}`, { stdio: "inherit", cwd: process.cwd() });
}
