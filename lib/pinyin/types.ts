/**
 * 拼音模块类型
 * @author 代长亚
 */

export type ReadingSource = "kx" | "manual" | "algo" | "sidecar";

export type PinyinScript = "traditional" | "simplified";

export type CharReading = {
  char: string;
  pinyin: string;
  source: ReadingSource;
  ambiguous?: string[];
};

export type ParagraphPinyin = {
  canonicalId?: string;
  readings: CharReading[];
  textHash: string;
};

export type SegmentOptions = {
  canonicalId?: string;
  script?: PinyinScript;
  sidecarReadings?: CharReading[];
};

export const MAX_PINYIN_TEXT_LENGTH = 50_000;
