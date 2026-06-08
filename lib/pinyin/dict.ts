/**
 * 拼音词典加载
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { BUDDHIST_PHRASES } from "./buddhist-phrases";
import type { KxCharDict } from "./kx-dict";

export type PhraseDict = Map<string, string[]>;

let phraseDict: PhraseDict | null = null;
let kxDict: KxCharDict | null = null;
let dictVersion: string | null = null;

function dictDir(): string {
  return process.env.PINYIN_DICT_DIR ?? path.join(process.cwd(), "data/pinyin");
}

export function getDictVersion(): string {
  if (dictVersion) return dictVersion;
  const vf = path.join(dictDir(), "dict-version.txt");
  if (fs.existsSync(vf)) {
    dictVersion = fs.readFileSync(vf, "utf-8").trim();
    return dictVersion;
  }
  dictVersion = process.env.PINYIN_DICT_VERSION ?? "embedded";
  return dictVersion;
}

export function getPhraseDict(): PhraseDict {
  if (phraseDict) return phraseDict;
  const map = new Map<string, string[]>();
  for (const [phrase, py] of BUDDHIST_PHRASES) {
    map.set(phrase, py.split(/\s+/).filter(Boolean));
  }
  const jsonPath = path.join(dictDir(), "buddhist-phrases.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as {
        phrases?: [string, string][];
      };
      for (const [phrase, py] of raw.phrases ?? []) {
        map.set(phrase, py.split(/\s+/).filter(Boolean));
      }
    } catch {
      /* use embedded */
    }
  }
  phraseDict = map;
  return map;
}

export function getKxDict(): KxCharDict {
  if (kxDict) return kxDict;
  const jsonPath = path.join(dictDir(), "kx-char.json");
  if (fs.existsSync(jsonPath)) {
    kxDict = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as KxCharDict;
    return kxDict;
  }
  kxDict = {};
  return kxDict;
}

export function resetDictCache(): void {
  phraseDict = null;
  kxDict = null;
  dictVersion = null;
}
