/**
 * SQLite 连接（Next.js server 入口，含 server-only 守卫）
 * @author 代长亚
 */
import "server-only";

export { closeDb, getDb, getSqlite } from "./sqlite";
