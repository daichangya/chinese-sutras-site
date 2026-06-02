/**
 * 繁简转换类型
 * @author jingxin
 */

export type ConvertBackend = "auto" | "js" | "cli";

export type ConvertDirection = "t2s" | "s2t";

export type ScriptDetect = "traditional" | "simplified" | "mixed" | "unknown";

export type ConvertOptions = {
  /** 预处理：去 CBETA 行间标记等 */
  normalize?: boolean;
  backend?: ConvertBackend;
  direction?: ConvertDirection;
};

export type ConvertResult = {
  text: string;
  original: string;
  detected: ScriptDetect;
  backend: "js" | "cli";
};
