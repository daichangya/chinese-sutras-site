/**
 * 康熙字典单字拼音（构建产物类型）
 * @author 代长亚
 */

export type KxCharEntry = {
  pinyin: string;
  alternatives?: string[];
  zhuyin?: string;
};

export type KxCharDict = Record<string, KxCharEntry>;
