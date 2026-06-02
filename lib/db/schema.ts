/**
 * jingxin 数据模型 — paragraph 为系统中枢
 * @author jingxin
 */
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const sutra = sqliteTable("sutra", {
  id: text("id").primaryKey(),
  cbetaId: text("cbeta_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  translator: text("translator"),
  category: text("category"),
  charCount: integer("char_count").default(0),
});

export const chapter = sqliteTable("chapter", {
  id: text("id").primaryKey(),
  sutraId: text("sutra_id")
    .notNull()
    .references(() => sutra.id),
  seq: integer("seq").notNull(),
  title: text("title"),
});

export const paragraph = sqliteTable(
  "paragraph",
  {
    id: text("id").primaryKey(),
    sutraId: text("sutra_id")
      .notNull()
      .references(() => sutra.id),
    /** CBETA anchor span（用于 canonical_id 与可读定位） */
    startRef: text("start_ref"),
    endRef: text("end_ref"),
    /** 仅当前生成版本有效的排序/调试字段 */
    parserPid: text("parser_pid"),
    /** 内容校验（不参与身份） */
    contentHash: text("content_hash"),
    /** 所属卷序号（0 = 全文单卷） */
    juanSeq: integer("juan_seq").notNull().default(0),
    /** 顺序字段：用于阅读时稳定排序 */
    seq: integer("seq").notNull(),
    text: text("text").notNull(),
    /** 白话译文（保留，将来导入） */
    colloquial: text("colloquial"),
    commentary: text("commentary"),
    lecture: text("lecture"),
  },
  (t) => [
    index("paragraph_sutra_seq_idx").on(t.sutraId, t.seq),
    index("paragraph_sutra_juan_idx").on(t.sutraId, t.juanSeq),
  ],
);

export const tag = sqliteTable("tag", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const sutraTag = sqliteTable("sutra_tag", {
  sutraId: text("sutra_id").notNull(),
  tagId: text("tag_id").notNull(),
});

export const topic = sqliteTable("topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
});

export const topicItem = sqliteTable("topic_item", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull(),
  sutraId: text("sutra_id").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const dailyVerse = sqliteTable("daily_verse", {
  id: text("id").primaryKey(),
  verseDate: text("verse_date").notNull().unique(),
  paragraphId: text("paragraph_id"),
  customText: text("custom_text"),
  aiSummary: text("ai_summary"),
});

export const aiExplanationCache = sqliteTable("ai_explanation_cache", {
  cacheKey: text("cache_key").primaryKey(),
  tab: text("tab").notNull(),
  content: text("content").notNull(),
  model: text("model"),
  createdAt: integer("created_at").notNull(),
});

export const pinyinCache = sqliteTable("pinyin_cache", {
  cacheKey: text("cache_key").primaryKey(),
  readings: text("readings").notNull(),
  dictVersion: text("dict_version").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const userBookmark = sqliteTable("user_bookmark", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  targetType: text("target_type").notNull(),
  sutraId: text("sutra_id"),
  paragraphId: text("paragraph_id"),
  createdAt: integer("created_at").notNull(),
});
