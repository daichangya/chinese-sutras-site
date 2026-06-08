/**
 * SQLite 连接级 PRAGMA（低内存部署限制页缓存等）
 * @author 代长亚
 */
import type Database from "better-sqlite3";
import { isLowMemoryDeploy, sqliteCacheMb } from "@/lib/deploy/profile";

/** 对新建连接应用部署档案相关 PRAGMA */
export function applySqlitePragmas(db: Database.Database): void {
  const cacheMb = sqliteCacheMb();
  if (cacheMb != null) {
    db.pragma(`cache_size = -${cacheMb * 1024}`);
  }
  if (isLowMemoryDeploy()) {
    db.pragma("mmap_size = 0");
  }
}
