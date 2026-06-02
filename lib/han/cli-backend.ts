/**
 * 系统 opencc CLI 后端（批量转换优先）
 * @author jingxin
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ConvertDirection } from "./types";
import { getCbetaExtraJsonPath } from "./dict";

let cliAvailableCache: boolean | null = null;

export function getOpenccBin(): string {
  return process.env.OPENCC_BIN ?? "opencc";
}

export function isCliAvailable(): boolean {
  if (cliAvailableCache !== null) return cliAvailableCache;
  try {
    execSync(`"${getOpenccBin()}" --version`, { stdio: "pipe" });
    cliAvailableCache = true;
  } catch {
    cliAvailableCache = false;
  }
  return cliAvailableCache;
}

/** 测试时可重置 CLI 可用性缓存 */
export function resetCliAvailabilityCache(): void {
  cliAvailableCache = null;
}

function openccConfig(direction: ConvertDirection): string {
  return direction === "t2s" ? "t2s.json" : "s2t.json";
}

export function convertViaCli(text: string, direction: ConvertDirection): string {
  const bin = getOpenccBin();
  const config = openccConfig(direction);
  const dictPath = getCbetaExtraJsonPath();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jingxin-opencc-"));
  const tmpIn = path.join(tmpDir, "in.txt");
  const tmpOut = path.join(tmpDir, "out.txt");

  try {
    fs.writeFileSync(tmpIn, text, "utf-8");
    const dictArg =
      direction === "t2s" && fs.existsSync(dictPath)
        ? ` -d "${dictPath.replace(/"/g, '\\"')}"`
        : "";
    execSync(`"${bin}" -i "${tmpIn}" -o "${tmpOut}" -c ${config}${dictArg}`, {
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return fs.readFileSync(tmpOut, "utf-8");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
