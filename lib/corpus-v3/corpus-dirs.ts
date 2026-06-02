/**
 * 语料库磁盘目录名（简体中文）
 * @author jingxin
 */

/** 正文（CBETA 繁体可读 MD，由 corpus:gen / restore-yuanwen 写入） */
export const DIR_YUANWEN = "原文";

/** 白话（人工） */
export const DIR_BAIHUA = "白话";

/** 注释（人工） */
export const DIR_ZHUSHI = "注释";

/** 简体副本（由 corpus:t2s 或 corpus:gen --t2s 从 原文/ 生成） */
export const DIR_JIANTI_LEGACY = "简体";

export const DIR_PINYIN = "拼音";

export const DIR_INDEX = "_index";

/** 旧目录名 → 新目录名（迁移用） */
export const LEGACY_SUBDIR_RENAMES: Record<string, string> = {
  白話: DIR_BAIHUA,
  注釋: DIR_ZHUSHI,
};

export const JUAN_CONTENT_DIRS = [DIR_YUANWEN, DIR_BAIHUA, DIR_ZHUSHI, DIR_JIANTI_LEGACY] as const;

/** corpus:simplify 会就地 t2s 的卷目录（不含 原文/、简体/） */
export const SIMPLIFY_MD_DIRS = [DIR_BAIHUA, DIR_ZHUSHI] as const;
