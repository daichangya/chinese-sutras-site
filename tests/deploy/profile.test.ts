/**
 * 部署档案环境变量
 * @author 代长亚
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  corpusCacheMaxSutras,
  isLowMemoryDeploy,
  sqliteCacheMb,
} from "@/lib/deploy/profile";

const ENV_KEYS = ["JX_LOW_MEMORY", "JX_SQLITE_CACHE_MB", "JX_CORPUS_CACHE_SUTRAS"] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe("deploy profile", () => {
  const snap = snapshotEnv();

  afterEach(() => {
    restoreEnv(snap);
  });

  it("isLowMemoryDeploy true for 1 and true", () => {
    process.env.JX_LOW_MEMORY = "1";
    expect(isLowMemoryDeploy()).toBe(true);
    process.env.JX_LOW_MEMORY = "true";
    expect(isLowMemoryDeploy()).toBe(true);
  });

  it("isLowMemoryDeploy false when unset or other values", () => {
    delete process.env.JX_LOW_MEMORY;
    expect(isLowMemoryDeploy()).toBe(false);
    process.env.JX_LOW_MEMORY = "0";
    expect(isLowMemoryDeploy()).toBe(false);
  });

  it("sqliteCacheMb defaults to 32 in lowmem", () => {
    process.env.JX_LOW_MEMORY = "1";
    delete process.env.JX_SQLITE_CACHE_MB;
    expect(sqliteCacheMb()).toBe(32);
  });

  it("sqliteCacheMb undefined when not lowmem", () => {
    delete process.env.JX_LOW_MEMORY;
    delete process.env.JX_SQLITE_CACHE_MB;
    expect(sqliteCacheMb()).toBeUndefined();
  });

  it("sqliteCacheMb respects JX_SQLITE_CACHE_MB override", () => {
    process.env.JX_SQLITE_CACHE_MB = "64";
    expect(sqliteCacheMb()).toBe(64);
  });

  it("corpusCacheMaxSutras defaults to 3 in lowmem", () => {
    process.env.JX_LOW_MEMORY = "1";
    delete process.env.JX_CORPUS_CACHE_SUTRAS;
    expect(corpusCacheMaxSutras()).toBe(3);
  });

  it("corpusCacheMaxSutras is Infinity when not lowmem", () => {
    delete process.env.JX_LOW_MEMORY;
    delete process.env.JX_CORPUS_CACHE_SUTRAS;
    expect(corpusCacheMaxSutras()).toBe(Number.POSITIVE_INFINITY);
  });
});
