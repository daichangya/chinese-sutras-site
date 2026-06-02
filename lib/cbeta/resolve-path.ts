/**
 * 解析 CBETA XML 文件路径
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { normalizeCbetaId } from "./corpus-category";

function xmlFileNameForCbetaId(cbetaId: string): string | null {
  const id = normalizeCbetaId(cbetaId);
  const numeric = id.match(/^([A-Z]+)(\d+)N(\d+)([A-Z]?)$/i);
  if (numeric) {
    const [, series, vol, num, suffix] = numeric;
    const volPadded = vol!.padStart(2, "0");
    const numPadded = num!.padStart(4, "0");
    return `${series}${volPadded}n${numPadded}${suffix ?? ""}.xml`;
  }
  const letterSutra = id.match(/^([A-Z]+)(\d+)N([A-Z]\d+)$/i);
  if (letterSutra) {
    const [, series, vol, num] = letterSutra;
    const volPadded = vol!.padStart(2, "0");
    return `${series}${volPadded}n${num}.xml`;
  }
  return null;
}

export function resolveCbetaXmlPath(cbetaId: string, xmlRoot: string): string | null {
  const fileName = xmlFileNameForCbetaId(cbetaId);
  if (!fileName) return null;
  const series = fileName.match(/^([A-Z]+)/)?.[1];
  if (!series) return null;
  const vol = fileName.match(/^([A-Z]+)(\d+)/)?.[2];
  if (!vol) return null;
  const volPadded = vol.padStart(2, "0");
  const direct = path.join(xmlRoot, series, `${series}${volPadded}`, fileName);
  if (fs.existsSync(direct)) return direct;

  const fixturePath = path.join("tests/fixtures", fileName);
  if (fs.existsSync(fixturePath)) return fixturePath;

  const globDir = path.join(xmlRoot, series);
  if (!fs.existsSync(globDir)) return null;
  const walk = (dir: string): string | null => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (entry.name === fileName) {
        return full;
      }
    }
    return null;
  };
  return walk(globDir);
}
