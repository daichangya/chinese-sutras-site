/**
 * AI 解释缓存
 * @author 代长亚
 */
import { createHash } from "crypto";
import { getSqlite } from "@/lib/db";
import type { ExplainTab } from "./prompts";

export function buildCacheKey(
  selection: string,
  paragraphId: string | undefined,
  tab: ExplainTab,
  model: string,
): string {
  const raw = `${tab}:${model}:${paragraphId ?? ""}:${selection}`;
  return createHash("sha256").update(raw).digest("hex");
}

export function getCachedExplanation(cacheKey: string): string | null {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT content FROM ai_explanation_cache WHERE cache_key = ?`)
    .get(cacheKey) as { content: string } | undefined;
  return row?.content ?? null;
}

export function setCachedExplanation(
  cacheKey: string,
  tab: ExplainTab,
  content: string,
  model: string,
): void {
  const db = getSqlite();
  db.prepare(
    `INSERT OR REPLACE INTO ai_explanation_cache (cache_key, tab, content, model, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(cacheKey, tab, content, model, Math.floor(Date.now() / 1000));
}
