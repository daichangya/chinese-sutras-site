/**
 * OpenCC 繁简转换（opencc-js + 可选系统 CLI）
 * @author jingxin
 */
import OpenCC from "opencc-js";
import { Trie } from "opencc-js/core";
import { convertViaCli, isCliAvailable } from "./cli-backend";
import { getCbetaExtraS2t, getCbetaExtraT2s } from "./dict";
import { normalizeForConversion } from "./normalize";
import type { ConvertBackend, ConvertOptions, ConvertResult, ScriptDetect } from "./types";

const MAX_TEXT_LENGTH = 50_000;

let t2sConverter: ((text: string) => string) | null = null;
let s2tConverter: ((text: string) => string) | null = null;

type DictGroup = Parameters<typeof Trie.prototype.loadDictGroup>[0];
type DictLike = string | readonly (readonly [string, string])[];

/** 与 opencc-js tw2s 一致：先分词再按链转换，避免裸用 Locale.from.tw 把「一」误转为「口」 */
function createSegmentedConverter(
  segmentationDict: DictLike,
  ...conversionChain: DictGroup[]
): (text: string) => string {
  const segmentation = new Trie();
  segmentation.loadDict(segmentationDict);
  const trieArr = conversionChain.map((grp) => {
    const trie = new Trie();
    trie.loadDictGroup(grp);
    return trie;
  });
  return (text: string) =>
    trieArr
      .reduce(
        (segments, trie) => segments.map((segment) => trie.convert(segment)),
        segmentation.segment(text),
      )
      .join("");
}

function createT2sConverter(): (text: string) => string {
  const { tw2s } = OpenCC.Locale.configs;
  const conversionChain: DictGroup[] = [
    tw2s.conversionChain[0],
    [...tw2s.conversionChain[1], getCbetaExtraT2s()],
  ];
  return createSegmentedConverter(tw2s.segmentation, ...conversionChain);
}

function getT2sJsConverter(): (text: string) => string {
  if (!t2sConverter) {
    t2sConverter = createT2sConverter();
  }
  return t2sConverter;
}

function getS2tJsConverter(): (text: string) => string {
  if (!s2tConverter) {
    const base = OpenCC.Converter({ from: "cn", to: "tw" });
    const custom = OpenCC.CustomConverter(getCbetaExtraS2t());
    s2tConverter = (text: string) => custom(base(text));
  }
  return s2tConverter;
}

export function detectScript(text: string): ScriptDetect {
  const sample = text.slice(0, 2000).trim();
  if (!sample) return "unknown";

  const asSimplified = getT2sJsConverter()(sample);
  const asTraditional = getS2tJsConverter()(sample);
  const changedByT2s = asSimplified !== sample;
  const changedByS2t = asTraditional !== sample;

  if (!changedByT2s && changedByS2t) return "simplified";
  if (changedByT2s && !changedByS2t) return "traditional";
  if (changedByT2s && changedByS2t) return "mixed";
  return "unknown";
}

function resolveBackend(backend: ConvertBackend | undefined, direction: "t2s" | "s2t"): "js" | "cli" {
  const mode = backend ?? "auto";
  if (mode === "js") return "js";
  if (mode === "cli") {
    if (!isCliAvailable()) {
      throw new Error(`OPENCC_BIN (${process.env.OPENCC_BIN ?? "opencc"}) 不可用，请安装 opencc 或使用 backend=js`);
    }
    return "cli";
  }
  return isCliAvailable() ? "cli" : "js";
}

function assertLength(text: string): void {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`text exceeds maximum length of ${MAX_TEXT_LENGTH}`);
  }
}

function convertInternal(
  text: string,
  direction: "t2s" | "s2t",
  opts: ConvertOptions = {},
): ConvertResult {
  assertLength(text);
  const original = text;
  let input = opts.normalize !== false ? normalizeForConversion(text) : text;
  const backend = resolveBackend(opts.backend, direction);

  let converted: string;
  if (backend === "cli") {
    converted = convertViaCli(input, direction);
  } else if (direction === "t2s") {
    converted = getT2sJsConverter()(input);
  } else {
    converted = getS2tJsConverter()(input);
  }

  return {
    text: converted,
    original,
    detected: detectScript(original),
    backend,
  };
}

/** 批量语料转换：单次 OpenCC，不做 detectScript；超长文本分块 */
export function t2sBatch(text: string, chunkSize = 80_000): string {
  const normalized = normalizeForConversion(text);
  if (normalized.length <= chunkSize) {
    return getT2sJsConverter()(normalized);
  }
  let out = "";
  for (let i = 0; i < normalized.length; i += chunkSize) {
    out += getT2sJsConverter()(normalized.slice(i, i + chunkSize));
  }
  return out;
}

/** 繁体 → 简体 */
export function t2s(text: string, opts: Omit<ConvertOptions, "direction"> = {}): ConvertResult {
  return convertInternal(text, "t2s", { ...opts, direction: "t2s" });
}

/** 简体 → 繁体 */
export function s2t(text: string, opts: Omit<ConvertOptions, "direction"> = {}): ConvertResult {
  return convertInternal(text, "s2t", { ...opts, direction: "s2t" });
}

export { MAX_TEXT_LENGTH };
