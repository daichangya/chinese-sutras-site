/**
 * Wikidata 人物坐标 enrich CLI
 * @author 代长亚
 */
import { closeDb } from "@/lib/db/sqlite";
import { runPersonGeoEnrich } from "@/lib/kg/enrich-person-geo";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]!, 10) : undefined;

  console.log("Fetching Wikidata Buddhist person coordinates…");
  const result = await runPersonGeoEnrich({ dryRun, limit });
  console.log(
    `Person geo: scanned=${result.scanned} matched=${result.matched} updated=${result.updated} skippedHasCoords=${result.skippedHasCoords}${dryRun ? " (dry-run)" : ""}`,
  );
  closeDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
