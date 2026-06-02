/**
 * 单文件 / stdin 繁简转换 CLI
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { t2s, s2t, type ConvertBackend } from "@/lib/han";

function usage(): never {
  console.error(`Usage:
  npm run convert:t2s -- [--file path] [-o out] [--backend auto|js|cli] [--no-normalize]
  npm run convert:s2t -- [--file path] [-o out] [--backend auto|js|cli]

  Stdin: echo "觀自在" | npm run convert:t2s --`);
  process.exit(1);
}

function parseArgs(direction: "t2s" | "s2t") {
  const argv = process.argv.slice(2);
  let file: string | undefined;
  let out: string | undefined;
  let backend: ConvertBackend = "auto";
  let normalize = true;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--file") file = argv[++i];
    else if (a === "-o" || a === "--output") out = argv[++i];
    else if (a === "--backend") backend = argv[++i] as ConvertBackend;
    else if (a === "--no-normalize") normalize = false;
    else if (a === "--help" || a === "-h") usage();
    else if (a === "--direction") {
      /* set by npm script */
    } else usage();
  }

  return { file, out, backend, normalize, direction };
}

async function readInput(file?: string): Promise<string> {
  if (file) {
    const abs = path.resolve(file);
    return fs.readFileSync(abs, "utf-8");
  }
  if (process.stdin.isTTY) usage();
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

async function main(): Promise<void> {
  const direction: "t2s" | "s2t" = process.argv.includes("--s2t") ? "s2t" : "t2s";
  const { file, out, backend, normalize } = parseArgs(direction);
  const input = await readInput(file);
  const convert = direction === "t2s" ? t2s : s2t;
  const result = convert(input, { backend, normalize });

  if (out) {
    fs.writeFileSync(path.resolve(out), result.text, "utf-8");
    console.error(`Wrote ${out} (backend=${result.backend})`);
  } else {
    process.stdout.write(result.text);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
