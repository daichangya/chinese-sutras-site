/**
 * 演示数据：从语料库导入并填充心经示例白话
 * @author jingxin
 */
import { execSync } from "child_process";
import { closeDb } from "@/lib/db";

// V2：直接生成心经（T08n0251）语料并导入数据库
console.log("Generating xinjing corpus V2 from CBETA XML…");
execSync("npm run corpus:gen -- --cbeta-id T08n0251 --limit 1", { stdio: "inherit" });

execSync("npm run corpus:import", { stdio: "inherit" });
closeDb();
console.log("Demo seed complete: corpus imported + FTS rebuilt");
