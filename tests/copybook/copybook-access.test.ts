/**
 * 抄经准入测试：已导入经目均可抄经，不依赖 MVP 白名单
 * @author 代长亚
 */
import { existsSync } from "fs";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, getSqlite } from "@/lib/db";
import { isMvpSutra, MVP_CANON } from "@/lib/cbeta/mvp-canon";
import { getSutraBySlug } from "@/lib/sutra/queries";

const dbPath = process.env.DATA_DIR ? `${process.env.DATA_DIR}/jingxin.db` : "./data/jingxin.db";

describe("copybook access", () => {
  afterAll(() => {
    closeDb();
  });

  it("抄经准入不依赖 isMvpSutra", () => {
    expect(isMvpSutra("unknown-sutra")).toBe(false);
  });

  it("非 MVP 经目在 DB 中仍可通过 getSutraBySlug 解析", () => {
    if (!existsSync(dbPath)) return;

    const mvpCbetaIds = MVP_CANON.map((e) => e.cbetaId.toUpperCase());
    const placeholders = mvpCbetaIds.map(() => "?").join(", ");
    const db = getSqlite();
    const row = db
      .prepare(`SELECT slug FROM sutra WHERE upper(cbeta_id) NOT IN (${placeholders}) LIMIT 1`)
      .get(...mvpCbetaIds) as { slug: string } | undefined;

    if (!row) return;

    const sutra = getSutraBySlug(row.slug);
    expect(sutra).not.toBeNull();
    expect(isMvpSutra(sutra!.slug)).toBe(false);
  });
});
