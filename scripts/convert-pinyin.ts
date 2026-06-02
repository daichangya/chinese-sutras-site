/**
 * 单文件 / stdin 拼音转换 CLI
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { t2s } from "@/lib/han";
import { segmentText, type PinyinScript } from "@/lib/pinyin";

function usage(): never {
  console.error(`Usage:
  npm run convert:pinyin -- [--text "觀自在"] [--file path] [-o out]
    [--script traditional|simplified] [--convert-t2s]
    [--format plain|ruby] [--separator " "]

  Stdin（npm 可能不转发 pipe，推荐 --text）:
  echo "觀自在" | npx tsx scripts/convert-pinyin.ts`);
  process.exit(1);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let file: string | undefined;
  let text: string | undefined;
  let out: string | undefined;
  let script: PinyinScript = "traditional";
  let convertT2s = false;
  let format: "plain" | "ruby" = "plain";
  let separator = " ";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--file") file = argv[++i];
    else if (a === "--text") text = argv[++i];
    else if (a === "-o" || a === "--output") out = argv[++i];
    else if (a === "--script") script = argv[++i] as PinyinScript;
    else if (a === "--convert-t2s") convertT2s = true;
    else if (a === "--format") format = argv[++i] as "plain" | "ruby";
    else if (a === "--separator") separator = argv[++i] ?? " ";
    else if (a === "--help" || a === "-h") usage();
    else usage();
  }

  return { file, text, out, script, convertT2s, format, separator };
}

async function readInput(file?: string, text?: string): Promise<string> {
  if (text !== undefined) return text;
  if (file) return fs.readFileSync(path.resolve(file), "utf-8");
  if (process.stdin.isTTY) usage();
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

function toRuby(readings: ReturnType<typeof segmentText>["readings"]): string {
  return readings
    .map((r) => {
      if (!r.pinyin) return r.char;
      return `<ruby><rb>${r.char}</rb><rt>${r.pinyin}</rt></ruby>`;
    })
    .join("");
}

async function main(): Promise<void> {
  const { file, text, out, script, convertT2s, format, separator } = parseArgs();
  let input = await readInput(file, text);
  if (script === "simplified" && convertT2s) {
    input = t2s(input, { backend: "js" }).text;
  }

  const result = segmentText(input, { script, useCache: false, separator });
  const output = format === "ruby" ? toRuby(result.readings) : result.pinyin;

  if (out) {
    fs.writeFileSync(path.resolve(out), output, "utf-8");
    console.error(`Wrote ${out} (dict=${result.dictVersion})`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
