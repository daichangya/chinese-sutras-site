/**
 * 繁简转换模块入口
 * @author jingxin
 */
export { t2s, s2t, t2sBatch, detectScript, MAX_TEXT_LENGTH } from "./converter";
export type { ConvertBackend, ConvertDirection, ConvertOptions, ConvertResult, ScriptDetect } from "./types";
export { normalizeForConversion, stripCbetaInlineMarkers } from "./normalize";
export { convertViaCli, isCliAvailable, getOpenccBin } from "./cli-backend";
