/**
 * 系统 opencc CLI 后端（批量转换优先）
 * @author 代长亚
 */
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ConvertDirection } from "./types";
import { getCbetaExtraJsonPath } from "./dict";

let cliAvailableCache: boolean | null = null;
let cliDictSupportedCache: boolean | null = null;

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

/** OpenCC CLI 是否支持 -d 自定义词典（macOS/Homebrew 旧版常不支持） */
export function isCliDictSupported(): boolean {
  if (cliDictSupportedCache !== null) return cliDictSupportedCache;
  if (!isCliAvailable()) {
    cliDictSupportedCache = false;
    return false;
  }
  const dictPath = getCbetaExtraJsonPath();
  if (!fs.existsSync(dictPath)) {
    cliDictSupportedCache = false;
    return false;
  }
  const bin = getOpenccBin();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jingxin-opencc-probe-"));
  const tmpIn = path.join(tmpDir, "in.txt");
  const tmpOut = path.join(tmpDir, "out.txt");
  try {
    fs.writeFileSync(tmpIn, "觀", "utf-8");
    execSync(
      `"${bin}" -i "${tmpIn}" -o "${tmpOut}" -c t2s.json -d "${dictPath.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", stdio: "pipe" },
    );
    cliDictSupportedCache = true;
  } catch {
    cliDictSupportedCache = false;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  return cliDictSupportedCache;
}

/** 测试时可重置 CLI 可用性缓存 */
export function resetCliAvailabilityCache(): void {
  cliAvailableCache = null;
  cliDictSupportedCache = null;
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
      direction === "t2s" && isCliDictSupported()
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
