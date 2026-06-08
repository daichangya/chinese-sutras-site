/**
 * 将 chinese-sutras-md 下英文目录名改为中文（辞典、知识图谱、各辞典源）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import {
  CORPUS_DICT_SUBDIR,
  CORPUS_KG_SUBDIR,
  LEGACY_CORPUS_DICT_SUBDIR,
  LEGACY_CORPUS_KG_SUBDIR,
} from "@/lib/corpus-v3/paths";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";
import { dictSourceDirName } from "@/lib/dictionaries/source-dir";
import { HAN_DICTIONARY_SOURCES } from "@/lib/dictionaries/sources";

const corpusRoot = path.resolve(resolveCorpusRoot());
const dryRun = process.argv.includes("--dry-run");

function renameIfExists(from: string, to: string): boolean {
  if (!fs.existsSync(from)) return false;
  if (from === to) return false;
  if (fs.existsSync(to)) {
    console.warn(`  skip (target exists): ${to}`);
    return false;
  }
  console.log(`  ${path.relative(corpusRoot, from)} → ${path.relative(corpusRoot, to)}`);
  if (!dryRun) fs.renameSync(from, to);
  return true;
}

function main() {
  console.log(`${dryRun ? "[dry-run] " : ""}Rename corpus dirs to Chinese under ${corpusRoot}`);

  renameIfExists(
    path.join(corpusRoot, LEGACY_CORPUS_DICT_SUBDIR),
    path.join(corpusRoot, CORPUS_DICT_SUBDIR),
  );
  renameIfExists(
    path.join(corpusRoot, LEGACY_CORPUS_KG_SUBDIR),
    path.join(corpusRoot, CORPUS_KG_SUBDIR),
  );

  const dictRoot = fs.existsSync(path.join(corpusRoot, CORPUS_DICT_SUBDIR))
    ? path.join(corpusRoot, CORPUS_DICT_SUBDIR)
    : path.join(corpusRoot, LEGACY_CORPUS_DICT_SUBDIR);
  const sourcesDir = path.join(dictRoot, "sources");
  if (fs.existsSync(sourcesDir)) {
    console.log("Dictionary sources:");
    for (const meta of HAN_DICTIONARY_SOURCES) {
      const zhDir = dictSourceDirName(meta.code);
      renameIfExists(path.join(sourcesDir, meta.code), path.join(sourcesDir, zhDir));
    }
    for (const name of fs.readdirSync(sourcesDir)) {
      if (name === "sources") continue;
      const full = path.join(sourcesDir, name);
      if (!fs.statSync(full).isDirectory()) continue;
      if (/^[a-z][a-z0-9_-]*$/i.test(name) && !HAN_DICTIONARY_SOURCES.some((s) => dictSourceDirName(s.code) === name)) {
        console.warn(`  ⚠ 未映射的英文源目录: sources/${name}`);
      }
    }
  }

  const kgRoot = fs.existsSync(path.join(corpusRoot, CORPUS_KG_SUBDIR))
    ? path.join(corpusRoot, CORPUS_KG_SUBDIR)
    : path.join(corpusRoot, LEGACY_CORPUS_KG_SUBDIR);
  const geoLegacy = path.join(kgRoot, "geo");
  if (fs.existsSync(geoLegacy)) {
    /* geo 子目录名已是中文或通用名，无需改 */
  }

  console.log(dryRun ? "Dry-run done." : "Done.");
}

main();
