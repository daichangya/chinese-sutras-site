/**
 * 抄经页专用 opencc-js 转换（无 Node fs 依赖，可在客户端使用）
 * @author 代长亚
 */
import OpenCC from "opencc-js";
import { Trie } from "opencc-js/core";
import { CBETA_EXTRA_S2T, CBETA_EXTRA_T2S } from "@/lib/han/cbeta-extra-phrases";

type DictGroup = Parameters<typeof Trie.prototype.loadDictGroup>[0];
type DictLike = string | readonly (readonly [string, string])[];

let t2sFn: ((text: string) => string) | null = null;
let s2tFn: ((text: string) => string) | null = null;

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

function getT2s(): (text: string) => string {
  if (!t2sFn) {
    const { tw2s } = OpenCC.Locale.configs;
    const conversionChain: DictGroup[] = [
      tw2s.conversionChain[0],
      [...tw2s.conversionChain[1], CBETA_EXTRA_T2S],
    ];
    t2sFn = createSegmentedConverter(tw2s.segmentation, ...conversionChain);
  }
  return t2sFn;
}

function getS2t(): (text: string) => string {
  if (!s2tFn) {
    const base = OpenCC.Converter({ from: "cn", to: "tw" });
    const custom = OpenCC.CustomConverter(CBETA_EXTRA_S2T);
    s2tFn = (text: string) => custom(base(text));
  }
  return s2tFn;
}

export function copybookT2s(char: string): string {
  return getT2s()(char);
}

export function copybookS2t(char: string): string {
  return getS2t()(char);
}
