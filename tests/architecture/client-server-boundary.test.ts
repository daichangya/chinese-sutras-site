/**
 * 防止 Client Component 值导入 server-only 模块（会触发 fs/better-sqlite3 打包错误）
 * @author 代长亚
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "../..");

const SCAN_DIRS = [join(ROOT, "app"), join(ROOT, "components")];

const FORBIDDEN_VALUE_IMPORTS = [
  "@/lib/db",
  "@/lib/search/unified",
  "@/lib/search/fts",
  "@/lib/kg/graph",
  "@/lib/canon/browse",
  "@/lib/stats/corpus-stats",
  "@/lib/ai/rag-retrieval",
];

function collectClientFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      out.push(...collectClientFiles(full));
    } else if (name.endsWith(".tsx")) {
      const src = readFileSync(full, "utf8");
      if (/^["']use client["']/m.test(src) || /^\s*["']use client["']/m.test(src)) {
        out.push(full);
      }
    }
  }
  return out;
}

function findForbiddenValueImports(source: string): string[] {
  const violations: string[] = [];
  for (const mod of FORBIDDEN_VALUE_IMPORTS) {
    const escaped = mod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const valueImport = new RegExp(
      `import\\s+(?!type\\s)[^;\\n]*from\\s+["']${escaped}["']`,
      "g",
    );
    if (valueImport.test(source)) {
      violations.push(mod);
    }
  }
  return violations;
}

describe("client-server boundary", () => {
  it("client components must not value-import server-only modules", () => {
    const clientFiles = SCAN_DIRS.flatMap((dir) => collectClientFiles(dir));
    const allViolations: { file: string; modules: string[] }[] = [];

    for (const file of clientFiles) {
      const src = readFileSync(file, "utf8");
      const modules = findForbiddenValueImports(src);
      if (modules.length > 0) {
        allViolations.push({
          file: relative(ROOT, file),
          modules,
        });
      }
    }

    expect(allViolations).toEqual([]);
  });
});
