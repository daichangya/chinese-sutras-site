/**
 * 康熙字典单字拼音（构建产物类型）
 * @author jingxin
 */

export type KxCharEntry = {
  pinyin: string;
  alternatives?: string[];
  zhuyin?: string;
};

export type KxCharDict = Record<string, KxCharEntry>;
