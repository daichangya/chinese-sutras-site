/**
 * CBETA / OpenCC 扩展词库加载
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { CBETA_EXTRA_S2T, CBETA_EXTRA_T2S } from "./cbeta-extra-phrases";

export type DictPair = [string, string];

const DEFAULT_DICT_PATH = path.join(process.cwd(), "data/opencc/cbeta-extra.json");

/** opencc-js 用：繁→简 扩展短语（长词优先由 ConverterFactory 处理） */
export function getCbetaExtraT2s(): DictPair[] {
  return CBETA_EXTRA_T2S;
}

/** opencc-js 用：简→繁 扩展短语 */
export function getCbetaExtraS2t(): DictPair[] {
  return CBETA_EXTRA_S2T;
}

/** OpenCC CLI -d 参数用的 JSON 路径 */
export function getCbetaExtraJsonPath(): string {
  return process.env.OPENCC_DICT ?? DEFAULT_DICT_PATH;
}

export function loadCbetaExtraJson(): { t2s: DictPair[]; s2t: DictPair[] } {
  const p = getCbetaExtraJsonPath();
  if (!fs.existsSync(p)) {
    return { t2s: CBETA_EXTRA_T2S, s2t: CBETA_EXTRA_S2T };
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as {
    t2s?: DictPair[];
    s2t?: DictPair[];
  };
  return {
    t2s: raw.t2s ?? CBETA_EXTRA_T2S,
    s2t: raw.s2t ?? CBETA_EXTRA_S2T,
  };
}
