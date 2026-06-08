/**
 * 从 cbeta/cc 词库 + cbeta-manual.json 生成 OpenCC 扩展词典
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CC_DIR = path.join(ROOT, "cbeta/cc");
const OUT_DIR = path.join(ROOT, "data/opencc");
const MANUAL_PATH = path.join(OUT_DIR, "cbeta-manual.json");
const EXTRA_JSON = path.join(OUT_DIR, "cbeta-extra.json");
const EXTRA_TS = path.join(ROOT, "lib/han/cbeta-extra-phrases.ts");

type DictPair = [string, string];

type OpenccExtraJson = {
  t2s: DictPair[];
  s2t: DictPair[];
};

function parseOpenccTxt(filePath: string): DictPair[] {
  if (!fs.existsSync(filePath)) return [];
  const pairs: DictPair[] = [];
  const seen = new Set<string>();
  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\t/);
    if (parts.length < 2) continue;
    const from = parts[0]!.trim();
    const to = parts[1]!.trim().split(/\s+/)[0] ?? "";
    if (!from || !to) continue;
    const key = `${from}\t${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([from, to]);
  }
  return pairs;
}

function mergePairs(base: DictPair[], extra: DictPair[]): DictPair[] {
  const map = new Map<string, string>();
  for (const [from, to] of base) map.set(from, to);
  for (const [from, to] of extra) map.set(from, to);
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"));
}

function loadManual(): OpenccExtraJson {
  if (!fs.existsSync(MANUAL_PATH)) {
    return { t2s: [], s2t: [] };
  }
  const raw = JSON.parse(fs.readFileSync(MANUAL_PATH, "utf-8")) as Partial<OpenccExtraJson>;
  return {
    t2s: Array.isArray(raw.t2s) ? raw.t2s : [],
    s2t: Array.isArray(raw.s2t) ? raw.s2t : [],
  };
}

function writeExtraTs(t2s: DictPair[], s2t: DictPair[]): void {
  const fmt = (pairs: DictPair[]) =>
    pairs.map(([a, b]) => `  [${JSON.stringify(a)}, ${JSON.stringify(b)}]`).join(",\n");
  const content = `/**
 * CBETA 扩展词库（由 scripts/build-opencc-dict.ts 生成，勿手改）
 * @author 代长亚
 */
export const CBETA_EXTRA_T2S: [string, string][] = [
${fmt(t2s)}
];

export const CBETA_EXTRA_S2T: [string, string][] = [
${fmt(s2t)}
];
`;
  fs.writeFileSync(EXTRA_TS, content, "utf-8");
}

function main(): void {
  const cbetaVariantXml = (() => {
    const i = process.argv.indexOf("--cbeta-variant-xml");
    return i >= 0 ? process.argv[i + 1] : undefined;
  })();

  if (cbetaVariantXml) {
    console.warn(
      `--cbeta-variant-xml 尚未实现；请从 https://cbetaonline.dila.edu.tw/ 下载异体字表后手动补充 cbeta-manual.json`,
    );
  }

  const tsPhrases = parseOpenccTxt(path.join(CC_DIR, "TSPhrases.txt"));
  const tsChars = parseOpenccTxt(path.join(CC_DIR, "TSCharacters.txt"));
  const manual = loadManual();

  const t2s = mergePairs([...tsPhrases, ...tsChars], manual.t2s);
  const s2t = mergePairs(manual.s2t, []);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const extra: OpenccExtraJson = { t2s, s2t };
  fs.writeFileSync(EXTRA_JSON, JSON.stringify(extra, null, 2) + "\n", "utf-8");
  writeExtraTs(t2s, s2t);

  console.log(`Wrote ${EXTRA_JSON} (t2s=${t2s.length}, s2t=${s2t.length})`);
  console.log(`Wrote ${EXTRA_TS}`);
}

main();
