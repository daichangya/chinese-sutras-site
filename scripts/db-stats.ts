/**
 * 输出主库 / 检索库体积报告
 * @author 代长亚
 */
import fs from "fs";
import {
  collectDbStats,
  formatDbStatsReport,
  resolveMainDbPath,
  resolveSearchDbPath,
} from "@/lib/db/db-stats";

const json = process.argv.includes("--json");
const dataDir = process.env.DATA_DIR ?? "./data";

const mainPath = resolveMainDbPath(dataDir);
const searchPath = resolveSearchDbPath(dataDir);

const reports = [
  { label: "jingxin.db (main)", path: mainPath },
  { label: "jingxin-search.db", path: searchPath },
].map(({ label, path }) => {
  if (!fs.existsSync(path)) {
    return { label, path, missing: true as const };
  }
  return { label, path, missing: false as const, report: collectDbStats(path) };
});

if (json) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  for (const r of reports) {
    if (r.missing) {
      console.log(`=== ${r.label} ===\npath: ${r.path}\n(missing)\n`);
      continue;
    }
    console.log(formatDbStatsReport(r.label, r.report!));
    console.log("");
  }
}
