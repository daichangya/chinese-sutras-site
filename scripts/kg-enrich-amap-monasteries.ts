/**
 * 高德寺院 POI enrich CLI
 * @author 代长亚
 */
import { closeDb } from "@/lib/db/sqlite";
import {
  defaultAmapTemplesPath,
  enrichAmapMonasteries,
  loadAmapTemplesFromFile,
} from "@/lib/kg/enrich-amap-monasteries";

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const filePath = fileArg ? fileArg.split("=")[1]! : defaultAmapTemplesPath();

  const pois = loadAmapTemplesFromFile(filePath);
  const result = enrichAmapMonasteries(pois, { dryRun });
  console.log(
    `Amap monasteries: loaded=${result.loaded} jsonl+=${result.insertedJsonl} sqlite+=${result.insertedSqlite} skipped=${result.skippedExisting}${dryRun ? " (dry-run)" : ""}`,
  );
  closeDb();
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
