/**
 * 登录后将 deviceKey 数据迁移到用户账号
 * @author 代长亚
 */
import "server-only";
import { getSqlite } from "@/lib/db";
import { isValidDeviceKey } from "@/lib/auth/require-user";

export type MergeResult = {
  readingProgress: number;
  bookmarks: number;
  annotations: number;
  history: number;
};

export function mergeDeviceDataToUser(userId: string, deviceKey: string): MergeResult {
  if (!isValidDeviceKey(deviceKey) || deviceKey === userId) {
    return { readingProgress: 0, bookmarks: 0, annotations: 0, history: 0 };
  }

  const db = getSqlite();
  const mergeProgress = db
    .prepare(
      `UPDATE reading_progress SET user_key = ?
       WHERE user_key = ?
       AND NOT EXISTS (
         SELECT 1 FROM reading_progress rp
         WHERE rp.user_key = ? AND rp.sutra_id = reading_progress.sutra_id
       )`,
    )
    .run(userId, deviceKey, userId);
  db.prepare(`DELETE FROM reading_progress WHERE user_key = ?`).run(deviceKey);

  const mergeBookmarks = db
    .prepare(`UPDATE user_bookmark_sync SET user_key = ? WHERE user_key = ?`)
    .run(userId, deviceKey);
  const mergeAnnotations = db
    .prepare(`UPDATE user_annotation SET user_key = ? WHERE user_key = ?`)
    .run(userId, deviceKey);
  const mergeHistory = db
    .prepare(`UPDATE reading_history SET user_key = ? WHERE user_key = ?`)
    .run(userId, deviceKey);

  return {
    readingProgress: mergeProgress.changes,
    bookmarks: mergeBookmarks.changes,
    annotations: mergeAnnotations.changes,
    history: mergeHistory.changes,
  };
}
