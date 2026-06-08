/**
 * 语料段落读取
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as importAlign from "@/lib/corpus-v3/import-align";
import * as metaMod from "@/lib/corpus-v3/meta";
import {
  clearCorpusParagraphCache,
  corpusBundleCacheSize,
  loadParagraphBodiesForCbetaId,
  readParagraphBody,
} from "@/lib/corpus-v3/read-paragraph";

const fixtureRoot = path.join(process.cwd(), "tests/tmp/corpus-v3");
const ENV_KEYS = ["JX_LOW_MEMORY", "JX_CORPUS_CACHE_SUTRAS"] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

function fakeBundle(cbetaId: string): importAlign.ImportSutraBundle {
  return {
    cbetaId,
    slug: cbetaId.toLowerCase(),
    title: cbetaId,
    translator: null,
    category: null,
    chapters: [],
    paragraphs: [
      {
        seq: 1,
        canonicalId: `${cbetaId}:p0001`,
        startRef: null,
        endRef: null,
        parserPid: null,
        contentHash: null,
        juanSeq: 0,
        text: `正文-${cbetaId}`,
        colloquial: null,
        commentary: null,
        lecture: null,
      },
    ],
    warnings: [],
  };
}

describe("read-paragraph", () => {
  const envSnap = snapshotEnv();

  beforeAll(() => {
    clearCorpusParagraphCache();
  });

  afterEach(() => {
    clearCorpusParagraphCache();
    metaMod.clearCorpusDirIndexCache();
    restoreEnv(envSnap);
    vi.restoreAllMocks();
  });

  it("loads paragraph text from 简体 MD via blocks.jsonl", () => {
    if (!fs.existsSync(path.join(fixtureRoot, "阿含（小乘根本经典）/长阿含经_T01n0001/meta.yaml"))) {
      return;
    }
    const map = loadParagraphBodiesForCbetaId("T01n0001", { corpusRoot: fixtureRoot });
    expect(map.size).toBeGreaterThan(0);
    const first = [...map.keys()][0]!;
    const body = readParagraphBody("T01n0001", first, { corpusRoot: fixtureRoot });
    expect(body?.text.length).toBeGreaterThan(0);
  });

  it("evicts oldest cached sutra when lowmem limit exceeded", () => {
    process.env.JX_LOW_MEMORY = "1";
    process.env.JX_CORPUS_CACHE_SUTRAS = "2";

    const corpusRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jx-lru-corpus-"));
    const sutrasRoot = path.join(corpusRoot, "经藏");
    for (const rel of ["a/T01n0001", "b/T02n0002", "c/T03n0003"]) {
      fs.mkdirSync(path.join(sutrasRoot, rel), { recursive: true });
      fs.writeFileSync(path.join(sutrasRoot, rel, "meta.yaml"), "cbeta_id: test\n");
    }

    vi.spyOn(metaMod, "getCorpusDirIndex").mockReturnValue({
      relByCbetaId: new Map([
        ["T01n0001", "a/T01n0001"],
        ["T02n0002", "b/T02n0002"],
        ["T03n0003", "c/T03n0003"],
      ]),
      cbetaIdByRel: new Map(),
    });
    const buildSpy = vi.spyOn(importAlign, "buildImportBundle").mockImplementation((opts) => {
      const p = opts.metaPath;
      const cbetaId = p.includes("0001") ? "T01n0001" : p.includes("0002") ? "T02n0002" : "T03n0003";
      return fakeBundle(cbetaId);
    });

    loadParagraphBodiesForCbetaId("T01n0001", { corpusRoot });
    loadParagraphBodiesForCbetaId("T02n0002", { corpusRoot });
    expect(corpusBundleCacheSize()).toBe(2);

    loadParagraphBodiesForCbetaId("T03n0003", { corpusRoot });
    expect(corpusBundleCacheSize()).toBe(2);

    const callsBefore = buildSpy.mock.calls.length;
    loadParagraphBodiesForCbetaId("T01n0001", { corpusRoot });
    expect(buildSpy.mock.calls.length).toBeGreaterThan(callsBefore);

    fs.rmSync(corpusRoot, { recursive: true, force: true });
  });
});
