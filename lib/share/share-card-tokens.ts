/**
 * 分享卡片导出尺寸与视觉 token
 * @author 代长亚
 */

/** 导出画布宽（px） */
export const SHARE_CARD_WIDTH = 1080;

/** 导出画布高（px），4:5 */
export const SHARE_CARD_HEIGHT = 1350;

/** 分享卡片 DOM id，供导出截图 */
export const SHARE_CARD_EXPORT_ID = "share-card-export";

export const SHARE_CARD_COLORS = {
  paperElevated: "#fffefb",
  paper: "#f8f5ef",
  inkClassical: "#2b2318",
  ink: "#1c1917",
  muted: "#78716c",
  mutedLabel: "#9a8e7a",
  cinnabar: "#8b2500",
  gold: "#b08d57",
  border: "#d9d0c1",
  borderGold: "#dcc9a0",
  cinnabarTint: "rgb(139 37 0 / 0.04)",
} as const;

export const SHARE_CARD_BACKGROUND = `linear-gradient(135deg, ${SHARE_CARD_COLORS.paperElevated} 0%, ${SHARE_CARD_COLORS.paper} 55%, ${SHARE_CARD_COLORS.cinnabarTint} 100%)`;

/** 引文区最小高度，短摘录垂直居中 */
export const SHARE_CARD_QUOTE_MIN_HEIGHT = 480;

/** 标题字号（px） */
export const SHARE_CARD_TITLE_FONT_SIZE = 32;

/** 引文字号范围（px） */
export const SHARE_CARD_EXCERPT_FONT_MIN = 28;
export const SHARE_CARD_EXCERPT_FONT_MAX = 36;

/** 内边距（px） */
export const SHARE_CARD_PADDING = 64;

/** QR 码边长（px） */
export const SHARE_CARD_QR_SIZE = 96;

/**
 * 按摘录字符数计算引文字号（长文略缩小）
 */
export function computeShareExcerptFontSize(charCount: number): number {
  if (charCount <= 40) return SHARE_CARD_EXCERPT_FONT_MAX;
  if (charCount <= 80) return 32;
  if (charCount <= 120) return 30;
  if (charCount <= 200) return SHARE_CARD_EXCERPT_FONT_MIN;
  return 24;
}
