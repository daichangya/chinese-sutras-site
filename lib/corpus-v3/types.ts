/**
 * Corpus V3 类型定义
 * @author jingxin
 */
import type { StructureBlock, StructureJuan } from "@/lib/cbeta/structure";

/** 在家目录子类（见 cbeta/static/zaijia.txt，仅 meta，不参与目录路径） */
export type SutraZaijiaMeta = {
  /** 一级部类，如 般若部類（zaijia.txt 原文） */
  section?: string;
  /** 二级主题，如 其他般若 */
  topic?: string;
  /** 经｜疏（疏含疏钞、释论、发隐等） */
  kind?: "经" | "疏";
};

export type SutraMeta = {
  cbetaId: string;
  title: string;
  /** 可选；默认由 cbeta_id 推导 */
  slug?: string;
  alias?: string[];
  translator?: string;
  dynasty?: string;
  category: string;
  /** 在家目录子类（zaijia.txt） */
  zaijia?: SutraZaijiaMeta;
  juanCount?: number;
  sourceXml: string[];
  description?: string;
  /** 目录消歧标签（如「录文二」），生成/迁移时写入 meta.yaml */
  dirLabel?: string;
};

export type ImportChapter = {
  seq: number;
  title: string;
};

export type JuanFileKind = "原文" | "白话" | "注释" | "简体";

export type { StructureBlock, StructureJuan };

export type GeneratedSutraLayout = {
  sutraDir: string;
  metaPath: string;
  juanFiles: Array<{
    juanNum: number;
    label: string;
    yuanwen: string;
    baihua: string;
    zhushi: string;
  }>;
  blockCount: number;
};
