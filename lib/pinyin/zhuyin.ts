/**
 * 注音符号（Bopomofo）转汉语拼音
 * @author jingxin
 */

const INITIALS = new Set("ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ");
const MEDIALS = new Set("ㄧㄨㄩ");
const FINALS = new Set("ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ");

const INITIAL_PINYIN: Record<string, string> = {
  ㄅ: "b",
  ㄆ: "p",
  ㄇ: "m",
  ㄈ: "f",
  ㄉ: "d",
  ㄊ: "t",
  ㄋ: "n",
  ㄌ: "l",
  ㄍ: "g",
  ㄎ: "k",
  ㄏ: "h",
  ㄐ: "j",
  ㄑ: "q",
  ㄒ: "x",
  ㄓ: "zh",
  ㄔ: "ch",
  ㄕ: "sh",
  ㄖ: "r",
  ㄗ: "z",
  ㄘ: "c",
  ㄙ: "s",
};

/** 无声调拼音音节表（含零声母） */
const SYLLABLE_PINYIN: Record<string, string> = {
  ㄚ: "a",
  ㄛ: "o",
  ㄜ: "e",
  ㄝ: "e",
  ㄞ: "ai",
  ㄟ: "ei",
  ㄠ: "ao",
  ㄡ: "ou",
  ㄢ: "an",
  ㄣ: "en",
  ㄤ: "ang",
  ㄥ: "eng",
  ㄦ: "er",
  ㄧ: "yi",
  ㄨ: "wu",
  ㄩ: "yu",
  ㄧㄚ: "ya",
  ㄧㄛ: "yo",
  ㄧㄝ: "ye",
  ㄧㄞ: "yai",
  ㄧㄠ: "yao",
  ㄧㄡ: "you",
  ㄧㄢ: "yan",
  ㄧㄣ: "yin",
  ㄧㄤ: "yang",
  ㄧㄥ: "ying",
  ㄨㄚ: "wa",
  ㄨㄛ: "wo",
  ㄨㄞ: "wai",
  ㄨㄟ: "wei",
  ㄨㄢ: "wan",
  ㄨㄣ: "wen",
  ㄨㄤ: "wang",
  ㄨㄥ: "wong",
  ㄩㄝ: "yue",
  ㄩㄢ: "yuan",
  ㄩㄣ: "yun",
  ㄩㄥ: "yong",
};

function buildSyllableMap(): Map<string, string> {
  const map = new Map<string, string>(Object.entries(SYLLABLE_PINYIN));

  for (const [initZy, initPy] of Object.entries(INITIAL_PINYIN)) {
    for (const finZy of FINALS) {
      if (finZy === "ㄦ" && initZy !== "ㄦ") continue;
      const finPy = SYLLABLE_PINYIN[finZy];
      if (!finPy) continue;
      map.set(initZy + finZy, initPy + finPy);
    }
    for (const medZy of MEDIALS) {
      for (const finZy of FINALS) {
        const medPy =
          medZy === "ㄧ" ? "i" : medZy === "ㄨ" ? "u" : "ü";
        const finPy = SYLLABLE_PINYIN[finZy];
        if (!finPy) continue;
        if (medZy === "ㄩ" && "ㄝㄞㄟㄠㄡㄦ".includes(finZy)) continue;
        if (medZy === "ㄨ" && finZy === "ㄝ") continue;
        if (medZy === "ㄧ" && finZy === "ㄝ") {
          map.set(initZy + medZy + finZy, initPy + "ie");
          continue;
        }
        if (medZy === "ㄨ" && finZy === "ㄥ") {
          map.set(initZy + medZy + finZy, initPy + "ong");
          continue;
        }
        if (medZy === "ㄩ" && finZy === "ㄝ") {
          map.set(initZy + medZy + finZy, initPy + "ue");
          continue;
        }
        if (medZy === "ㄩ" && finZy === "ㄢ") {
          map.set(initZy + medZy + finZy, initPy + "uan");
          continue;
        }
        if (medZy === "ㄩ" && finZy === "ㄣ") {
          map.set(initZy + medZy + finZy, initPy + "un");
          continue;
        }
        if (medZy === "ㄩ" && finZy === "ㄥ") {
          map.set(initZy + medZy + finZy, initPy + "iong");
          continue;
        }
        const body =
          medZy === "ㄧ" && "ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥ".includes(finZy)
            ? finPy.startsWith("y")
              ? finPy.slice(1)
              : finPy
            : medZy === "ㄨ" && "ㄚㄛㄞㄟㄢㄣㄤㄥ".includes(finZy)
              ? finPy.startsWith("w")
                ? finPy.slice(1)
                : finPy
              : medPy + finPy;
        map.set(initZy + medZy + finZy, initPy + body);
      }
      const medOnly =
        medZy === "ㄧ" ? "i" : medZy === "ㄨ" ? "u" : "ü";
      map.set(initZy + medZy, initPy + medOnly);
    }
    map.set(initZy + "ㄨㄛ", initPy + "uo");
    map.set(initZy + "ㄨㄞ", initPy + "uai");
    map.set(initZy + "ㄨㄟ", initPy + "ui");
    map.set(initZy + "ㄨㄢ", initPy + "uan");
    map.set(initZy + "ㄨㄣ", initPy + "un");
    map.set(initZy + "ㄨㄤ", initPy + "uang");
    map.set(initZy + "ㄨㄥ", initPy + "ong");
    map.set(initZy + "ㄧㄚ", initPy + "ia");
    map.set(initZy + "ㄧㄛ", initPy + "io");
    map.set(initZy + "ㄧㄝ", initPy + "ie");
    map.set(initZy + "ㄧㄠ", initPy + "iao");
    map.set(initZy + "ㄧㄡ", initPy + "iu");
    map.set(initZy + "ㄧㄢ", initPy + "ian");
    map.set(initZy + "ㄧㄣ", initPy + "in");
    map.set(initZy + "ㄧㄤ", initPy + "iang");
    map.set(initZy + "ㄧㄥ", initPy + "ing");
  }

  return map;
}

const SYLLABLE_MAP = buildSyllableMap();

function applyTone(base: string, tone: number, neutral: boolean): string {
  if (neutral || tone === 5 || tone === 0) return base;
  const t = Math.min(4, Math.max(1, tone));

  const marks: Record<string, [string, string, string, string]> = {
    a: ["ā", "á", "ǎ", "à"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    o: ["ō", "ó", "ǒ", "ò"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
    v: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  const normalized = base.replace(/ü/g, "v");
  for (const vowel of ["a", "e", "o"]) {
    const idx = normalized.indexOf(vowel);
    if (idx >= 0) {
      const rep = marks[vowel]![t - 1]!;
      return normalized.slice(0, idx) + rep + normalized.slice(idx + 1);
    }
  }

  if (normalized.includes("iu")) {
    const idx = normalized.indexOf("u");
    const rep = marks.u![t - 1]!;
    return normalized.slice(0, idx) + rep + normalized.slice(idx + 1);
  }
  if (normalized.includes("ui")) {
    const idx = normalized.indexOf("i");
    const rep = marks.i![t - 1]!;
    return normalized.slice(0, idx) + rep + normalized.slice(idx + 1);
  }

  for (const vowel of ["i", "u", "v"]) {
    const idx = normalized.lastIndexOf(vowel);
    if (idx >= 0) {
      const rep = marks[vowel]![t - 1]!;
      return (
        normalized.slice(0, idx) +
        rep +
        normalized.slice(idx + 1).replace(/v/g, "ü")
      );
    }
  }

  return base;
}

function parseOneSyllable(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  let neutral = false;
  if (s.startsWith("˙")) {
    neutral = true;
    s = s.slice(1);
  }

  let tone = 1;
  if (s.endsWith("ˊ")) {
    tone = 2;
    s = s.slice(0, -1);
  } else if (s.endsWith("ˇ")) {
    tone = 3;
    s = s.slice(0, -1);
  } else if (s.endsWith("ˋ")) {
    tone = 4;
    s = s.slice(0, -1);
  } else if (s.endsWith("-")) {
    tone = 1;
    s = s.slice(0, -1);
  }

  s = s.trim();
  if (!s) return null;

  const base = SYLLABLE_MAP.get(s);
  if (!base) return null;
  return applyTone(base.replace(/v/g, "ü"), tone, neutral);
}

/** 将 kx.xml 中的 <zy> 内容转为带调拼音（多读音取第一个） */
export function zhuyinToPinyin(zy: string): string | null {
  const cleaned = zy.replace(/^注音：/, "").trim();
  if (!cleaned) return null;

  const alternatives = cleaned.split(/[,，]/);
  for (const alt of alternatives) {
    const py = parseOneSyllable(alt);
    if (py) return py;
  }
  return null;
}

/** 返回全部候选读音 */
export function zhuyinToPinyinAll(zy: string): string[] {
  const cleaned = zy.replace(/^注音：/, "").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/[,，]/)
    .map((alt) => parseOneSyllable(alt))
    .filter((x): x is string => Boolean(x));
}
