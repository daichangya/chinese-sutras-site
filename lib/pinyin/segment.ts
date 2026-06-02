/**
 * 段落拼音分词
 * @author jingxin
 */
import { createHash } from "crypto";
import { resolveHanSpan, readingsFromSidecar } from "./resolve";
import type { CharReading, PinyinScript, SegmentOptions } from "./types";

export type TextToken =
  | { kind: "han"; value: string; start: number }
  | { kind: "other"; value: string; start: number };

const HAN_RE = /\p{Script=Han}/u;

export function isHanChar(ch: string): boolean {
  return HAN_RE.test(ch);
}

/** 将文本拆为汉字连续段与非汉字段 */
export function tokenizeForPinyin(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;
  while (i < text.length) {
    const start = i;
    const han = isHanChar(text[i]!);
    while (i < text.length && isHanChar(text[i]!) === han) i++;
    tokens.push({
      kind: han ? "han" : "other",
      value: text.slice(start, i),
      start,
    });
  }
  return tokens;
}

export function hashText(text: string, script: PinyinScript, dictVersion: string): string {
  return createHash("sha256")
    .update(`${script}\0${dictVersion}\0${text}`)
    .digest("hex");
}

export function toPlainText(readings: CharReading[], sep = " "): string {
  return readings
    .filter((r) => r.pinyin)
    .map((r) => r.pinyin)
    .join(sep);
}

export function segmentParagraph(text: string, opts: SegmentOptions = {}): CharReading[] {
  const script = opts.script ?? "traditional";

  if (opts.sidecarReadings?.length) {
    return opts.sidecarReadings;
  }

  const tokens = tokenizeForPinyin(text);
  const readings: CharReading[] = [];

  for (const tok of tokens) {
    if (tok.kind === "han") {
      readings.push(...resolveHanSpan(tok.value, script));
    } else {
      for (const ch of tok.value) {
        readings.push({ char: ch, pinyin: "", source: "algo" });
      }
    }
  }

  return readings;
}

export { readingsFromSidecar };
