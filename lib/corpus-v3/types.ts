/**
 * Corpus V3 类型定义
 * @author 代长亚
 */
import type { StructureBlock, StructureJuan } from "@/lib/cbeta/structure";

/** bulei.txt 部类目录元数据（不参与顶层路径，供审计） */
export type SutraBuleiMeta = {
  section_code: string;
  section: string;
  group: string;
  path?: string[];
  kind?: "经" | "疏";
  /** 数据来源：bulei.txt / juan / sutralist / short / catalog / alias / inferred */
  source?: string;
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
  /** bulei 部类目录（cbwork-bin/cbreader2X/bulei/bulei.txt） */
  bulei?: SutraBuleiMeta;
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
