/**
 * DILA TEI P5 辞典 XML 解析
 * @author 代长亚
 */
import { XMLParser } from "fast-xml-parser";
import type { DictionaryEntryRecord } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (name) => name === "entry" || name === "sense" || name === "term" || name === "def",
});

export function stripTeiText(el: unknown): string {
  if (el == null) return "";
  if (typeof el === "string" || typeof el === "number") return String(el).trim();
  if (Array.isArray(el)) return el.map(stripTeiText).join("").trim();
  if (typeof el === "object") {
    const o = el as Record<string, unknown>;
    let s = "";
    if (o["#text"] != null) s += String(o["#text"]);
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith("@_")) continue;
      s += stripTeiText(v);
    }
    return s.replace(/\s+/g, " ").trim();
  }
  return "";
}

function collectEntries(node: unknown, out: unknown[]): void {
  if (node == null || typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  if (o.entry) {
    const entries = Array.isArray(o.entry) ? o.entry : [o.entry];
    out.push(...entries);
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") collectEntries(v, out);
  }
}

export function parseTeiEntries(xml: string): unknown[] {
  const root = parser.parse(xml);
  const entries: unknown[] = [];
  collectEntries(root, entries);
  return entries;
}

export function parseSoothillEntry(
  entryEl: unknown,
  index: number,
  source: string,
): DictionaryEntryRecord | null {
  const el = entryEl as Record<string, unknown>;
  const form = el.form;
  const headword = stripTeiText(form);
  if (!headword) return null;
  const senses = el.sense;
  const senseList = senses == null ? [] : Array.isArray(senses) ? senses : [senses];
  const definition = senseList.map((s) => stripTeiText(s)).filter(Boolean).join("\n\n");
  if (!definition) return null;
  const entry_data: Record<string, unknown> = {};
  for (const s of senseList) {
    const terms = (s as Record<string, unknown>)?.term;
    const termList = terms == null ? [] : Array.isArray(terms) ? terms : [terms];
    for (const t of termList) {
      const lang = (t as Record<string, unknown>)?.["@_lang"];
      if (typeof lang === "string" && lang.includes("san")) {
        const txt = stripTeiText(t);
        if (txt) {
          entry_data.sanskrit = entry_data.sanskrit
            ? [entry_data.sanskrit, txt].flat()
            : txt;
        }
      }
    }
  }
  return {
    id: `${source}:shh-${index}`,
    source,
    headword,
    definition,
    lang: "zh",
    entry_data: Object.keys(entry_data).length ? entry_data : undefined,
  };
}

export function parseFormDefEntry(
  entryEl: unknown,
  index: number,
  source: string,
  lang = "zh",
): DictionaryEntryRecord | null {
  const el = entryEl as Record<string, unknown>;
  const headword = stripTeiText(el.form);
  if (!headword) return null;
  const senses = el.sense;
  const senseList = senses == null ? [] : Array.isArray(senses) ? senses : [senses];
  const definitions: string[] = [];
  const categories: string[] = [];
  for (const s of senseList) {
    const sense = s as Record<string, unknown>;
    const usg = stripTeiText(sense.usg);
    if (usg) categories.push(usg);
    const def = stripTeiText(sense.def);
    if (def) definitions.push(def);
    else {
      const full = stripTeiText(sense);
      if (full) definitions.push(full);
    }
  }
  if (!definitions.length) return null;
  return {
    id: `${source}:${index}`,
    source,
    headword,
    definition: definitions.join("\n\n"),
    lang,
    entry_data: categories.length ? { categories } : undefined,
  };
}

/** 翻譯名義大集：form.orth + cit/quote */
export function parseMvpEntry(
  entryEl: unknown,
  index: number,
  source: string,
): DictionaryEntryRecord | null {
  const el = entryEl as Record<string, unknown>;
  const form = el.form as Record<string, unknown> | undefined;
  let headword = "";
  if (form?.orth) {
    const orthList = Array.isArray(form.orth) ? form.orth : [form.orth];
    for (const o of orthList) {
      const item = o as Record<string, unknown>;
      const lang = String(item["@_lang"] ?? "");
      const text =
        typeof item["#text"] === "string" ? item["#text"].trim() : stripTeiText(item);
      if (lang.includes("san") && text) {
        headword = text;
        break;
      }
    }
    if (!headword) {
      const first = orthList[0] as Record<string, unknown>;
      headword =
        typeof first["#text"] === "string" ? first["#text"].trim() : stripTeiText(first);
    }
  } else {
    headword = stripTeiText(form);
  }
  if (!headword) {
    const key = el["@_key"] ?? el["@_id"];
    if (typeof key === "string") headword = key;
  }
  if (!headword) return null;

  const entry_data: Record<string, unknown> = {};
  const lines: string[] = [];
  const cits = el.cit;
  const citList = cits == null ? [] : Array.isArray(cits) ? cits : [cits];
  for (const c of citList) {
    const cit = c as Record<string, unknown>;
    const lang = String(cit["@_lang"] ?? "");
    const quote = stripTeiText(cit.quote ?? cit);
    if (!quote) continue;
    lines.push(`[${lang}] ${quote}`);
    if (lang.includes("zho") || lang.includes("Hant")) entry_data.chinese = quote;
    if (lang.includes("bod")) entry_data.tibetan = quote;
  }
  const senses = el.sense;
  const senseList = senses == null ? [] : Array.isArray(senses) ? senses : [senses];
  for (const s of senseList) {
    const t = stripTeiText(s);
    if (t) lines.push(t);
  }
  if (!lines.length) {
    const full = stripTeiText(el);
    if (full && full !== headword) lines.push(full);
  }
  if (!lines.length) return null;

  return {
    id: `${source}:${el["@_key"] ?? index}`,
    source,
    headword,
    definition: lines.join("\n"),
    lang: "sa",
    entry_data: Object.keys(entry_data).length ? entry_data : undefined,
  };
}

/** 五體清文鑑：多语 sense[@lang] */
export function parsePentaglotEntry(
  entryEl: unknown,
  index: number,
  source: string,
): DictionaryEntryRecord | null {
  const el = entryEl as Record<string, unknown>;
  const senses = el.sense;
  const senseList = senses == null ? [] : Array.isArray(senses) ? senses : [senses];
  const langs: Record<string, string> = {};
  for (const s of senseList) {
    const sense = s as Record<string, unknown>;
    const lang = String(sense["@_lang"] ?? sense["@_xml:lang"] ?? "");
    const text =
      typeof sense["#text"] === "string" ? sense["#text"].trim() : stripTeiText(sense);
    if (lang && text) langs[lang] = text;
  }
  const hw =
    langs["zho-Hant"] ??
    langs["zho-Hans"] ??
    langs["zho"] ??
    langs["san-Latn"] ??
    langs["san"] ??
    "";
  if (!hw) return null;
  const definition = Object.entries(langs)
    .map(([lang, text]) => `[${lang}] ${text}`)
    .join("\n");
  if (!definition) return null;
  return {
    id: `${source}:${el["@_id"] ?? index}`,
    source,
    headword: hw,
    reading: langs["san-Latn"] ?? langs["san"] ?? undefined,
    definition,
    lang: "zh",
    entry_data: langs,
  };
}

export function parseFormSenseEntry(
  entryEl: unknown,
  index: number,
  source: string,
  lang = "zh",
): DictionaryEntryRecord | null {
  const el = entryEl as Record<string, unknown>;
  let headword = stripTeiText(el.form);
  if (!headword) {
    const xmlId = el["@_xml:id"] ?? el["@_id"];
    headword = typeof xmlId === "string" ? xmlId : "";
  }
  if (!headword) return null;
  const senses = el.sense;
  const senseList = senses == null ? [] : Array.isArray(senses) ? senses : [senses];
  const parts = senseList.map((s) => stripTeiText(s)).filter(Boolean);
  if (!parts.length) return null;
  return {
    id: `${source}:${index}`,
    source,
    headword,
    definition: parts.join("\n\n"),
    lang,
  };
}
