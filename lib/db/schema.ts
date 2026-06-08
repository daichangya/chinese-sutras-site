/**
 * jingxin 数据模型 — paragraph 为系统中枢
 * @author 代长亚
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
    /** 所属卷序号（0 = 全文单卷） */
    juanSeq: integer("juan_seq").notNull().default(0),
    /** 顺序字段：用于阅读时稳定排序 */
    seq: integer("seq").notNull(),
    /** 白话译文（保留，将来导入；正文在语料 MD） */
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

/** 分享记录 */
export const share = sqliteTable("share", {
  id: text("id").primaryKey(),
  sutraId: text("sutra_id").notNull(),
  paragraphId: text("paragraph_id").notNull(),
  /** 分享码（短 ID，用于 URL） */
  shareCode: text("share_code").notNull().unique(),
  /** 截取的文字片段 */
  excerpt: text("excerpt").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(0),
  viewCount: integer("view_count").notNull().default(0),
});

/** 服务端书签（支持段落级收藏 + 多端同步） */
export const bookmark = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    sutraId: text("sutra_id").notNull(),
    paragraphIndex: integer("paragraph_index").notNull(),
    content: text("content"),
    createdAt: integer("created_at")
      .notNull()
      .default(0),
    updatedAt: integer("updated_at")
      .notNull()
      .default(0),
  },
  (t) => [index("bookmark_sutra_user_idx").on(t.sutraId, t.userId)],
);
