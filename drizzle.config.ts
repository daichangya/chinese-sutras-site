import { defineConfig } from "drizzle-kit";
import path from "path";

const dataDir = process.env.DATA_DIR ?? "./data";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(dataDir, "jingxin.db"),
  },
});
