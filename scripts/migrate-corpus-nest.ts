/**
 * 将语料库根下 23 部类目录迁入 经藏/，与 辞典、知识图谱 并列
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import {
  CORPUS_SUTRAS_SUBDIR,
  isReservedCorpusTopDir,
  nestedSutrasRootHasContent,
  resolveSutrasRoot,
} from "@/lib/corpus-v3/paths";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const dryRun = process.argv.includes("--dry-run");

const SKIP_TOP_NAMES = new Set([
  ".git",
  "README.md",
  ".gitignore",
  "push-by-dept.sh",
  "git-add-n.sh",
  ".push-log.txt",
]);

function shouldMoveTopDir(name: string): boolean {
  if (name.startsWith(".")) return false;
  if (SKIP_TOP_NAMES.has(name)) return false;
  if (isReservedCorpusTopDir(name)) return false;
  if (name === CORPUS_SUTRAS_SUBDIR) return false;
  const full = path.join(corpusRoot, name);
  return fs.statSync(full).isDirectory();
}

if (nestedSutrasRootHasContent(corpusRoot)) {
  console.log(`Already nested under ${CORPUS_SUTRAS_SUBDIR}/ (${resolveSutrasRoot(corpusRoot)})`);
  process.exit(0);
}

const toMove = fs.readdirSync(corpusRoot).filter(shouldMoveTopDir);
if (toMove.length === 0) {
  console.log("No top-level dept directories to move.");
  process.exit(0);
}

const nested = path.join(corpusRoot, CORPUS_SUTRAS_SUBDIR);
console.log(`${dryRun ? "[dry-run] " : ""}Move ${toMove.length} dirs into ${CORPUS_SUTRAS_SUBDIR}/`);
for (const name of toMove) {
  console.log(`  ${name}/ -> ${CORPUS_SUTRAS_SUBDIR}/${name}/`);
  if (!dryRun) {
    fs.mkdirSync(nested, { recursive: true });
    fs.renameSync(path.join(corpusRoot, name), path.join(nested, name));
  }
}

if (!dryRun) {
  console.log(`Done. Sutras root: ${resolveSutrasRoot(corpusRoot)}`);
}
