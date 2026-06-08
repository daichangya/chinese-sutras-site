/**
 * 从 kx.xml + buddhist-phrases.json 生成拼音词典
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { zhuyinToPinyin, zhuyinToPinyinAll } from "@/lib/pinyin/zhuyin";

const ROOT = process.cwd();
const KX_PATH = path.join(ROOT, "cbeta/variants/kx.xml");
const OUT_DIR = path.join(ROOT, "data/pinyin");
const PHRASES_PATH = path.join(OUT_DIR, "buddhist-phrases.json");
const KX_JSON = path.join(OUT_DIR, "kx-char.json");
const PHRASES_TS = path.join(ROOT, "lib/pinyin/buddhist-phrases.ts");
const VERSION_FILE = path.join(OUT_DIR, "dict-version.txt");

type PhrasePair = [string, string];

type KxCharEntry = {
  pinyin: string;
  alternatives?: string[];
  zhuyin?: string;
};

function loadPhrases(): PhrasePair[] {
  if (!fs.existsSync(PHRASES_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(PHRASES_PATH, "utf-8")) as {
    phrases?: PhrasePair[];
  };
  return Array.isArray(raw.phrases) ? raw.phrases : [];
}

function writePhrasesTs(phrases: PhrasePair[]): void {
  const fmt = phrases
    .map(([a, b]) => `  [${JSON.stringify(a)}, ${JSON.stringify(b)}]`)
    .join(",\n");
  const content = `/**
 * 佛经专名词组拼音（由 scripts/build-pinyin-dict.ts 生成，勿手改）
 * @author 代长亚
 */
export const BUDDHIST_PHRASES: [string, string][] = [
${fmt}
];
`;
  fs.writeFileSync(PHRASES_TS, content, "utf-8");
}

function parseKxXml(filePath: string): Record<string, KxCharEntry> {
  const dict: Record<string, KxCharEntry> = {};
  if (!fs.existsSync(filePath)) {
    console.warn(`kx.xml not found: ${filePath}`);
    return dict;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const whRe = /<wh[^>]*unicode="([^"]*)"[^>]*>([^<]*)<\/wh>/g;
  const zyRe = /<zy>(?:注音：)?([^<]+)<\/zy>/g;

  let whMatch: RegExpExecArray | null;
  const whPositions: Array<{ index: number; char: string; unicode: string }> = [];

  while ((whMatch = whRe.exec(content)) !== null) {
    const unicode = whMatch[1]!.trim();
    if (!unicode || unicode === " " || unicode === "00") continue;
    const codePoint = parseInt(unicode, 16);
    if (Number.isNaN(codePoint) || codePoint < 0x3400) continue;
    const char = String.fromCodePoint(codePoint);
    whPositions.push({ index: whMatch.index, char, unicode });
  }

  const zyPositions: Array<{ index: number; zy: string }> = [];
  let zyMatch: RegExpExecArray | null;
  while ((zyMatch = zyRe.exec(content)) !== null) {
    zyPositions.push({ index: zyMatch.index, zy: zyMatch[1]!.trim() });
  }

  for (let i = 0; i < whPositions.length; i++) {
    const wh = whPositions[i]!;
    const nextWhIndex = whPositions[i + 1]?.index ?? content.length;
    const zy = zyPositions.find((z) => z.index > wh.index && z.index < nextWhIndex);
    if (!zy) continue;

    const all = zhuyinToPinyinAll(zy.zy);
    const primary = zhuyinToPinyin(zy.zy);
    if (!primary) continue;

    dict[wh.char] = {
      pinyin: primary,
      alternatives: all.length > 1 ? all : undefined,
      zhuyin: zy.zy,
    };
  }

  return dict;
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const phrases = loadPhrases();
  writePhrasesTs(phrases);

  console.log("Parsing kx.xml (may take a minute)...");
  const kx = parseKxXml(KX_PATH);
  fs.writeFileSync(KX_JSON, JSON.stringify(kx, null, 0) + "\n", "utf-8");

  const version = `${phrases.length}-phrases-${Object.keys(kx).length}-kx-${new Date().toISOString().slice(0, 10)}`;
  fs.writeFileSync(VERSION_FILE, version + "\n", "utf-8");

  console.log(`Wrote ${PHRASES_TS} (${phrases.length} phrases)`);
  console.log(`Wrote ${KX_JSON} (${Object.keys(kx).length} chars)`);
  console.log(`Dict version: ${version}`);
}

main();
