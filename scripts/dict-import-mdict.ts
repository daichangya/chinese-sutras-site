/**
 * MDict 辞典导入 CLI（佛光大辭典等）
 * @author 代长亚
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { ensureDictCatalog } from "@/lib/dictionaries/catalog-init";
import { countEntriesJsonl } from "@/lib/dictionaries/io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_MDX = path.join(REPO_ROOT, "佛光大辭典", "佛光大辭典增訂版[阿彌陀佛]20230501.mdx");
const REQUIREMENTS = path.join(__dirname, "requirements-dict-mdict.txt");

function pythonCandidates(): string[] {
  const seen = new Set<string>();
  const add = (p?: string | null) => {
    if (!p || seen.has(p)) return;
    seen.add(p);
  };
  const ordered: string[] = [];
  const push = (p: string) => {
    if (!seen.has(p)) {
      seen.add(p);
      ordered.push(p);
    }
  };

  push(process.env.DICT_MDICT_PYTHON ?? "");
  push(process.env.PYTHON ?? "");
  if (process.env.CONDA_PREFIX) {
    push(path.join(process.env.CONDA_PREFIX, "bin", process.platform === "win32" ? "python.exe" : "python"));
  }
  push("python");
  push("python3");
  return ordered.filter(Boolean);
}

function canImportMdict(python: string): boolean {
  try {
    execFileSync(python, ["-c", "import mdict_utils"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function pythonExists(python: string): boolean {
  if (python.includes(path.sep)) return fs.existsSync(python);
  try {
    execFileSync(python, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** 优先选用已安装 mdict-utils 的解释器（conda tools 等），避免误用 Homebrew python3 */
function resolvePythonBin(): string {
  for (const bin of pythonCandidates()) {
    if (!pythonExists(bin)) continue;
    if (canImportMdict(bin)) return bin;
  }
  for (const bin of pythonCandidates()) {
    if (pythonExists(bin)) return bin;
  }
  return "python3";
}

function ensureMdictUtils(python: string): string {
  if (canImportMdict(python)) return python;

  console.log(`未在 ${python} 检测到 mdict-utils，尝试安装…`);
  try {
    execFileSync(python, ["-m", "pip", "install", "-r", REQUIREMENTS], {
      stdio: "inherit",
      cwd: REPO_ROOT,
    });
  } catch {
    console.error("\n自动安装失败。常见原因：python3 指向 Homebrew（PEP 668），而包装在 conda 里。");
    console.error("请任选其一：");
    console.error("  1. conda activate tools   # 确保 CONDA_PREFIX 生效后重试");
    console.error("  2. DICT_MDICT_PYTHON=/path/to/conda/envs/tools/bin/python npm run dict:import:mdict");
    console.error(`  3. ${python} -m pip install -r scripts/requirements-dict-mdict.txt`);
    process.exit(1);
  }
  if (!canImportMdict(python)) {
    console.error(`mdict-utils 安装后仍无法在 ${python} 中 import。`);
    process.exit(1);
  }
  return python;
}

function parseArgs(argv: string[]) {
  let mdx = process.env.FOGUANG_MDX_PATH ?? DEFAULT_MDX;
  let mdd = process.env.FOGUANG_MDD_PATH ?? "";
  let outDir = "";
  let limit = 0;
  let dryRun = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--mdx" && argv[i + 1]) mdx = path.resolve(argv[++i]!);
    else if (argv[i] === "--mdd" && argv[i + 1]) mdd = path.resolve(argv[++i]!);
    else if (argv[i] === "--out-dir" && argv[i + 1]) outDir = path.resolve(argv[++i]!);
    else if (argv[i] === "--limit" && argv[i + 1]) limit = parseInt(argv[++i]!, 10) || 0;
    else if (argv[i] === "--dry-run") dryRun = true;
  }
  return { mdx, mdd, outDir, limit, dryRun };
}

function main() {
  const { mdx, mdd, outDir, limit, dryRun } = parseArgs(process.argv);
  const dictRoot = resolveDictRoot();
  ensureDictCatalog(dictRoot);

  if (!fs.existsSync(mdx)) {
    console.error(`MDX not found: ${mdx}`);
    process.exit(1);
  }

  let python = resolvePythonBin();
  python = ensureMdictUtils(python);
  console.log(`Python: ${python}`);

  const pyScript = path.join(__dirname, "dict-import-mdict.py");
  const args = [pyScript, "--mdx", mdx];
  if (mdd) args.push("--mdd", mdd);
  if (outDir) args.push("--out-dir", outDir);
  if (limit > 0) args.push("--limit", String(limit));
  if (dryRun) args.push("--dry-run");

  console.log("Running MDict import…");
  execFileSync(python, args, { stdio: "inherit", cwd: REPO_ROOT });

  if (!dryRun) {
    const n = countEntriesJsonl("foguang", dictRoot);
    console.log(`foguang: ${n.toLocaleString()} entries in ${dictRoot}/sources/佛光大辞典/`);
  }
}

main();
