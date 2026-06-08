/**
 * slim 主库 + 语料 hydrate 阅读路径
 * @author 代长亚
 */
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetParagraphSchemaCache } from "@/lib/db/paragraph-schema";

const ENV_KEY = "JX_LOW_MEMORY";

const loadBodiesMock = vi.fn();
const readBodyMock = vi.fn();

vi.mock("@/lib/corpus-v3/read-paragraph", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/corpus-v3/read-paragraph")>();
  return {
    ...mod,
    loadParagraphBodiesForCbetaId: (...args: unknown[]) => loadBodiesMock(...args),
    readParagraphBody: (...args: unknown[]) => readBodyMock(...args),
  };
});

let testDb: Database.Database;

vi.mock("@/lib/db/sqlite", () => ({
  getSqlite: () => testDb,
  closeDb: () => {},
}));

function seedSlimDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE sutra (
      id TEXT PRIMARY KEY,
      cbeta_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      translator TEXT,
      category TEXT,
      char_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE paragraph (
      id TEXT PRIMARY KEY,
      sutra_id TEXT NOT NULL,
      juan_seq INTEGER NOT NULL DEFAULT 0,
      seq INTEGER NOT NULL,
      colloquial TEXT
    );
    INSERT INTO sutra VALUES ('s1', 'T08N0251', 'xinjing', '心经', '玄奘', NULL, 100);
    INSERT INTO paragraph VALUES ('T08N0251:p0001', 's1', 0, 1, NULL);
  `);
}

describe("queries slim hydrate path", () => {
  const prevLowMem = process.env[ENV_KEY];

  beforeEach(() => {
    resetParagraphSchemaCache();
    testDb = new Database(":memory:");
    seedSlimDb(testDb);
    loadBodiesMock.mockReset();
    readBodyMock.mockReset();
  });

  afterEach(() => {
    if (prevLowMem === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = prevLowMem;
    resetParagraphSchemaCache();
    testDb.close();
  });

  it("hydrates paragraph text from corpus when JX_LOW_MEMORY=1 and no text column", async () => {
    process.env[ENV_KEY] = "1";
    loadBodiesMock.mockReturnValue(
      new Map([
        [
          "T08N0251:p0001",
          { text: "观自在菩萨", colloquial: null, commentary: null },
        ],
      ]),
    );
    readBodyMock.mockReturnValue({ text: "观自在菩萨", colloquial: null, commentary: null });

    const { getParagraphsForSutra, getParagraphById } = await import("@/lib/sutra/queries");

    const paragraphs = getParagraphsForSutra("s1");
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]!.text).toBe("观自在菩萨");
    expect(loadBodiesMock).toHaveBeenCalledWith("T08N0251");

    const one = getParagraphById("T08N0251:p0001");
    expect(one?.text).toBe("观自在菩萨");
    expect(readBodyMock).toHaveBeenCalledWith("T08N0251", "T08N0251:p0001");
  });

  it("returns empty text when corpus unavailable in lowmem", async () => {
    process.env[ENV_KEY] = "1";
    const { CorpusNotAvailableError } = await import("@/lib/corpus-v3/read-paragraph");
    loadBodiesMock.mockImplementation(() => {
      throw new CorpusNotAvailableError("语料不可用");
    });

    const { getParagraphsForSutra } = await import("@/lib/sutra/queries");
    const paragraphs = getParagraphsForSutra("s1");
    expect(paragraphs[0]!.text).toBe("");
  });
});
