/**
 * 经目 slug 解析测试
 * @author jingxin
 */
import { existsSync } from "fs";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db";
import { getSutraBySlug } from "@/lib/sutra/queries";

const dbPath = process.env.DATA_DIR ? `${process.env.DATA_DIR}/jingxin.db` : "./data/jingxin.db";

describe("getSutraBySlug", () => {
  afterAll(() => {
    closeDb();
  });

  it("resolves MVP friendly slug xinjing when DB stores cbeta slug", () => {
    if (!existsSync(dbPath)) return;
    const sutra = getSutraBySlug("xinjing");
    expect(sutra).not.toBeNull();
    expect(sutra!.cbetaId.toUpperCase()).toBe("T08N0251");
    expect(sutra!.slug).toBe("xinjing");
  });

  it("still resolves cbeta-derived slug t08n0251", () => {
    if (!existsSync(dbPath)) return;
    const sutra = getSutraBySlug("t08n0251");
    expect(sutra).not.toBeNull();
    expect(sutra!.slug).toBe("xinjing");
  });
});
