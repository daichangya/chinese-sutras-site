/**
 * 繁简转换模块入口
 * @author 代长亚
 */
export { t2s, s2t, t2sBatch, detectScript, MAX_TEXT_LENGTH } from "./converter";
export type { ConvertBackend, ConvertDirection, ConvertOptions, ConvertResult, ScriptDetect } from "./types";
export { normalizeForConversion, stripCbetaInlineMarkers } from "./normalize";
export {
  toSimplifiedZh,
  toSimplifiedZhOptional,
  toSimplifiedZhIfCjk,
  normalizeDictionaryEntryForStorage,
  normalizeKgEntityForStorage,
  normalizeUserZhQuery,
} from "./storage-normalize";
export { convertViaCli, isCliAvailable, getOpenccBin } from "./cli-backend";
