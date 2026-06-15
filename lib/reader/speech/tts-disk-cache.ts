/**
 * TTS 磁盘缓存（SHA-256 分片路径，原子写入）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

let cacheRootOverride: string | null = null;

/** 测试用：覆盖缓存根目录 */
export function setTtsCacheRootForTests(root: string | null) {
  cacheRootOverride = root;
}

export function getTtsCacheRoot(): string {
  if (cacheRootOverride) return cacheRootOverride;
  const configured = process.env.TTS_CACHE_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data", "tts-cache");
}

export function resolveCachePath(cacheKey: string): string {
  const prefix = cacheKey.slice(0, 2);
  return path.join(getTtsCacheRoot(), prefix, `${cacheKey}.mp3`);
}

export function getCachedAudio(cacheKey: string): Buffer | null {
  const filePath = resolveCachePath(cacheKey);
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

export function putCachedAudio(cacheKey: string, data: Buffer): void {
  const filePath = resolveCachePath(cacheKey);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}
