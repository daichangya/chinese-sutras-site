/**
 * 佛经汉语拼音模块
 * @author 代长亚
 */
export type {
  CharReading,
  ParagraphPinyin,
  PinyinScript,
  ReadingSource,
  SegmentOptions,
} from "./types";
export { MAX_PINYIN_TEXT_LENGTH } from "./types";
export { zhuyinToPinyin, zhuyinToPinyinAll } from "./zhuyin";
export { getDictVersion, getKxDict, getPhraseDict, resetDictCache } from "./dict";
export { resolveHanSpan, readingsFromSidecar } from "./resolve";
export {
  hashText,
  isHanChar,
  segmentParagraph,
  toPlainText,
  tokenizeForPinyin,
} from "./segment";
export type { TextToken } from "./segment";
export { buildCacheKey, getCachedReadings, segmentWithCache, setCachedReadings } from "./cache";

import { getDictVersion } from "./dict";
import { segmentWithCache } from "./cache";
import { segmentParagraph, toPlainText } from "./segment";
import type { CharReading, PinyinScript, SegmentOptions } from "./types";

export type SegmentResult = {
  readings: CharReading[];
  cached: boolean;
  dictVersion: string;
  pinyin: string;
};

export function segmentText(
  text: string,
  opts: SegmentOptions & { useCache?: boolean; separator?: string } = {},
): SegmentResult {
  const script = opts.script ?? "traditional";
  const dictVersion = getDictVersion();
  const compute = () => segmentParagraph(text, opts);

  const { readings, cached } =
    opts.useCache !== false
      ? segmentWithCache(text, script, opts.canonicalId, compute)
      : { readings: compute(), cached: false };

  const sep = opts.separator ?? " ";
  return {
    readings,
    cached,
    dictVersion,
    pinyin: toPlainText(readings, sep),
  };
}
