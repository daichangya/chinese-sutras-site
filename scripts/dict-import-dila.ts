/**
 * DILA 辞典导入 CLI
 * @author 代长亚
 */
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { ensureDictCatalog } from "@/lib/dictionaries/catalog-init";
import { importDilaSource } from "@/lib/dictionaries/import-dila";
import { importNtiTsv } from "@/lib/dictionaries/import-nti";
import {
  getHanDictionarySource,
  getZhDilaImportSources,
  HAN_DICTIONARY_SOURCES,
  isZhOnlyDictionarySource,
} from "@/lib/dictionaries/sources";

function parseArgs(argv: string[]) {
  let source: string | undefined;
  let limit = 0;
  let allHan = false;
  let allLangs = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) source = argv[++i];
    else if (argv[i] === "--limit" && argv[i + 1]) limit = parseInt(argv[++i]!, 10) || 0;
    else if (argv[i] === "--all-han") allHan = true;
    else if (argv[i] === "--all-langs") allLangs = true;
  }
  return { source, limit, allHan, allLangs };
}

async function main() {
  const { source, limit, allHan, allLangs } = parseArgs(process.argv);
  const dictRoot = resolveDictRoot();
  const zhOnly = !allLangs;
  ensureDictCatalog(dictRoot);

  if (source === "nti") {
    if (zhOnly) {
      console.error("NTI 为汉英对照，默认跳过。若需导入请加 --all-langs");
      process.exit(1);
    }
    const { count } = await importNtiTsv({ limit, dictRoot });
    console.log(`nti: ${count} entries`);
    return;
  }

  let targets = allHan
    ? allLangs
      ? HAN_DICTIONARY_SOURCES.filter((s) => s.zip_filename && s.parser.startsWith("dila-tei"))
      : getZhDilaImportSources()
    : source
      ? [getHanDictionarySource(source)].filter(Boolean)
      : getZhDilaImportSources();

  if (!targets.length) {
    console.error("Unknown source. Use --source CODE or --all-han");
    process.exit(1);
  }

  if (zhOnly && source) {
    const meta = targets[0]!;
    if (!isZhOnlyDictionarySource(meta)) {
      console.error(
        `${source} 非「仅中文释义」源（如 Soothill 中英、翻译名义、五体清文等）。若确需请加 --all-langs`,
      );
      process.exit(1);
    }
  }

  if (zhOnly) {
    console.log("模式：仅中文释义（丁福保 / 南山律；不含 Soothill 中英）");
  }

  let failed = 0;
  for (const meta of targets) {
    if (!meta) continue;
    console.log(`Importing ${meta.code}…`);
    try {
      const { count } = await importDilaSource(meta, { limit, dictRoot, zhOnly });
      console.log(`  ${meta.code}: ${count} entries → ${dictRoot}/sources/${meta.code}/entries.jsonl`);
      if (count === 0) {
        console.warn(`  ⚠ ${meta.code}: 0 entries — check parser or ZIP content`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${meta.code} failed:`, err instanceof Error ? err.message : err);
      console.error(`    Retry: npm run dict:import:dila -- --source ${meta.code}`);
    }
  }
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
