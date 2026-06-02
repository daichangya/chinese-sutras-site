/**
 * 逐字/词组读音解析
 * @author jingxin
 */
import { pinyin } from "pinyin-pro";
import { getKxDict, getPhraseDict } from "./dict";
import type { CharReading, PinyinScript, ReadingSource } from "./types";

const MAX_PHRASE_LEN = 8;

function algoPinyin(char: string, traditional: boolean): string {
  return pinyin(char, {
    toneType: "symbol",
    type: "string",
    traditional,
  });
}

function resolveChar(char: string, traditional: boolean): CharReading {
  const kx = getKxDict()[char];
  if (kx?.pinyin) {
    return {
      char,
      pinyin: kx.pinyin,
      source: "kx",
      ambiguous: kx.alternatives,
    };
  }
  return {
    char,
    pinyin: algoPinyin(char, traditional),
    source: "algo",
  };
}

export function resolveHanSpan(text: string, script: PinyinScript = "traditional"): CharReading[] {
  const phrases = getPhraseDict();
  const traditional = script === "traditional";
  const out: CharReading[] = [];
  let i = 0;

  while (i < text.length) {
    let matched = false;
    const maxLen = Math.min(MAX_PHRASE_LEN, text.length - i);
    for (let len = maxLen; len >= 2; len--) {
      const slice = text.slice(i, i + len);
      const syllables = phrases.get(slice);
      if (!syllables || syllables.length !== len) continue;
      for (let j = 0; j < len; j++) {
        out.push({
          char: slice[j]!,
          pinyin: syllables[j] ?? "",
          source: "manual",
        });
      }
      i += len;
      matched = true;
      break;
    }

    if (matched) continue;

    const singleSyllables = phrases.get(text[i]!);
    if (singleSyllables?.length === 1) {
      out.push({
        char: text[i]!,
        pinyin: singleSyllables[0]!,
        source: "manual",
      });
      i += 1;
      continue;
    }

    out.push(resolveChar(text[i]!, traditional));
    i += 1;
  }

  return out;
}

export function readingsFromSidecar(
  tuples: Array<[string, string, ReadingSource?]>,
): CharReading[] {
  return tuples.map(([char, py, source]) => ({
    char,
    pinyin: py,
    source: source ?? "sidecar",
  }));
}
