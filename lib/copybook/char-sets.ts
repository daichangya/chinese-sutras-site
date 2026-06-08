/**
 * 抄经字体字符集合 — 用于覆盖率检查
 * 数据提取自 Selftrace/frontend/stele_chars.js
 * @author 代长亚
 */

import charSetsData from "./char-sets-data.json";

export const AoyagiLishuChars = new Set(charSetsData.aoyagilishu as string);
export const QijiChars = new Set(charSetsData.qiji as string);
export const XuandongKaiChars = new Set(charSetsData.xuandongkai as string);

export const COPYBOOK_CHAR_SETS: Record<string, Set<string>> = {
  aoyagi: AoyagiLishuChars,
  qiji: QijiChars,
  xuandong: XuandongKaiChars,
};
