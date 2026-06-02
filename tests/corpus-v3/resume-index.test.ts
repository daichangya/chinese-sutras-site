import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  buildCorpusResumeIndex,
  readCbetaIdFromMetaFile,
  writeSutraMeta,
} from "@/lib/corpus-v3/meta";
import { writeBlocksIndex } from "@/lib/corpus-v3/blocks-index";

describe("buildCorpusResumeIndex", () => {
  it("indexes cbeta_id without full yaml parse", () => {
    const tmp = path.join("tests", "tmp", "resume-index");
    fs.rmSync(tmp, { recursive: true, force: true });
    const sutraDir = path.join(tmp, "般若", "心經");
    fs.mkdirSync(sutraDir, { recursive: true });
    writeSutraMeta(path.join(sutraDir, "meta.yaml"), {
      cbetaId: "T08n0251",
      title: "心經",
      category: "般若",
      sourceXml: [],
    });
    writeBlocksIndex(sutraDir, [
      { juanNum: 1, label: "第1卷", blocks: [{ canonicalId: "T08n0251:p1", text: "x", kind: "prose" }] },
    ] as never);

    expect(readCbetaIdFromMetaFile(path.join(sutraDir, "meta.yaml"))).toBe("T08n0251");
    const idx = buildCorpusResumeIndex(tmp);
    expect(idx.generatedIds.has("T08n0251")).toBe(true);
    expect(idx.dirByCbetaId.get("T08n0251")).toBe("心經");
  });
});
