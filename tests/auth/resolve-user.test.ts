/**
 * 认证：微信用户 upsert / UnionID 合并
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeAuthDb } from "@/lib/auth/sqlite";
import { ensureAuthSchema } from "@/lib/auth/ensure-schema";

describe("resolveWechatUser", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-resolve-"));
    prevDataDir = process.env.DATA_DIR;
    process.env.DATA_DIR = tmpDir;
    closeAuthDb();
    const { getAuthSqlite } = await import("@/lib/auth/sqlite");
    ensureAuthSchema(getAuthSqlite());
  });

  afterEach(() => {
    process.env.DATA_DIR = prevDataDir;
    closeAuthDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("merges mp and open identities by union_id", async () => {
    const { resolveWechatUser } = await import("@/lib/auth/wechat/resolve-user");

    const mpUser = await resolveWechatUser({
      provider: "wechat_mp",
      openid: "mp_openid_1",
      unionId: "union_shared",
      nickname: "静心用户",
      avatarUrl: "https://example.com/a.png",
    });

    const openUser = await resolveWechatUser({
      provider: "wechat_open",
      openid: "open_openid_1",
      unionId: "union_shared",
      nickname: "静心用户",
      avatarUrl: null,
    });

    expect(openUser.id).toBe(mpUser.id);
    expect(openUser.unionId).toBe("union_shared");
  });

  it("reuses existing openid identity on repeat login", async () => {
    const { resolveWechatUser } = await import("@/lib/auth/wechat/resolve-user");

    const first = await resolveWechatUser({
      provider: "wechat_mp",
      openid: "same_openid",
      unionId: null,
      nickname: "A",
      avatarUrl: null,
    });

    const second = await resolveWechatUser({
      provider: "wechat_mp",
      openid: "same_openid",
      unionId: "late_union",
      nickname: "B",
      avatarUrl: null,
    });

    expect(second.id).toBe(first.id);
    expect(second.nickname).toBe("B");
    expect(second.unionId).toBe("late_union");
  });
});
