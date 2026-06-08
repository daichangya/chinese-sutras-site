/**
 * Next.js 启动钩子：预热 SQLite 连接
 * @author 代长亚
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { isLowMemoryDeploy } = await import("@/lib/deploy/profile");
    const { getSqlite } = await import("@/lib/db/sqlite");
    const mainDb = getSqlite();
    if (!isLowMemoryDeploy()) {
      const { getParagraphFtsDb } = await import("@/lib/db/search-sqlite");
      getParagraphFtsDb(mainDb);
    }
  }
}
