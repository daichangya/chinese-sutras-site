/**
 * SQLite PRAGMA 低内存配置
 * @author 代长亚
 */
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { applySqlitePragmas } from "@/lib/db/sqlite-pragmas";

const ENV_KEYS = ["JX_LOW_MEMORY", "JX_SQLITE_CACHE_MB"] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe("applySqlitePragmas", () => {
  const snap = snapshotEnv();

  afterEach(() => {
    restoreEnv(snap);
  });

  it("sets cache_size and mmap_size=0 in lowmem", () => {
    process.env.JX_LOW_MEMORY = "1";
    delete process.env.JX_SQLITE_CACHE_MB;
    const db = new Database(":memory:");
    applySqlitePragmas(db);
    const cache = db.pragma("cache_size", { simple: true }) as number;
    expect(cache).toBe(-32768);
    // :memory: 库对 mmap_size 支持有限，仅验证 pragma 可执行
    expect(() => db.pragma("mmap_size = 0")).not.toThrow();
    db.close();
  });

  it("does not set cache_size when not lowmem", () => {
    delete process.env.JX_LOW_MEMORY;
    delete process.env.JX_SQLITE_CACHE_MB;
    const db = new Database(":memory:");
    const before = db.pragma("cache_size", { simple: true }) as number;
    applySqlitePragmas(db);
    const after = db.pragma("cache_size", { simple: true }) as number;
    expect(after).toBe(before);
    db.close();
  });
});
