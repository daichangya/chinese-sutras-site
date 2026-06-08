/**
 * MDict MDX/MDD 路径归一化（佛光大辭典等）
 * @author 代长亚
 */

/** MDX HTML 内 img src：`/FGDCDZDB/foo.jpg` */
export function normalizeMdxImageSrc(src: string): string {
  const s = src.trim().replace(/\\/g, "/");
  const m = s.match(/^\/?FGDCDZDB\/(.+)$/i);
  if (m) return `assets/FGDCDZDB/${m[1]!}`;
  const base = s.split("/").pop() ?? s;
  return `assets/FGDCDZDB/${base}`;
}

/** MDD 资源键：`\FGDCDZDB\foo.jpg` → 磁盘相对路径 `assets/FGDCDZDB/foo.jpg` */
export function mddKeyToAssetPath(key: string): string {
  const s = key.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (/^FGDCDZDB\//i.test(s)) return `assets/${s}`;
  return `assets/FGDCDZDB/${s.split("/").pop() ?? s}`;
}

/** 资源 basename 查找键（MDD 索引用） */
export function mdictAssetBasename(keyOrSrc: string): string {
  const s = keyOrSrc.trim().replace(/\\/g, "/");
  return s.split("/").pop() ?? s;
}
