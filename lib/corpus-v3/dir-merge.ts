/**
 * 语料目录合并（目标已存在时递归并入，不覆盖已有文件）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

/** 将 from 目录内容并入 to；to 已存在时只补缺，最后删除空的 from */
export function mergeDirInto(from: string, to: string): void {
  if (path.resolve(from) === path.resolve(to)) return;
  if (!fs.existsSync(from)) return;

  if (!fs.existsSync(to)) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    return;
  }

  for (const ent of fs.readdirSync(from)) {
    const src = path.join(from, ent);
    const dst = path.join(to, ent);
    if (fs.statSync(src).isDirectory()) {
      mergeDirInto(src, dst);
    } else if (!fs.existsSync(dst)) {
      fs.renameSync(src, dst);
    }
  }
  fs.rmSync(from, { recursive: true, force: true });
}

/** 目录是否仅有 meta.yaml（迁移后留下的空壳） */
export function isMetaOnlySutraDir(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  const entries = fs.readdirSync(dir);
  return entries.length > 0 && entries.every((e) => e === "meta.yaml");
}
