/**
 * CI 检查：禁止 app/ 与 components/ 中使用非设计系统 Tailwind 类
 * @author 代长亚
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SCAN_DIRS = ["app", "components"];
const EXT = new Set([".tsx", ".ts", ".css"]);
const GLOBALS_CSS = join(ROOT, "app", "globals.css");

/** 设计系统核心 CSS 变量，须在 :root 中声明（可被 .dark 覆盖） */
const REQUIRED_ROOT_CSS_VARS = [
  "--jx-border",
  "--jx-border-strong",
  "--jx-paper",
  "--jx-accent-cinnabar",
] as const;

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "amber-*", re: /\bamber-/ },
  { name: "red-*", re: /\bred-\d/ },
  { name: "ring-offset-background", re: /\bring-offset-background\b/ },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (EXT.has(p.slice(p.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

const violations: Array<{ file: string; line: number; text: string; rule: string }> = [];

for (const dir of SCAN_DIRS) {
  const base = join(ROOT, dir);
  for (const file of walk(base)) {
    const rel = file.slice(ROOT.length + 1);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((text, i) => {
      for (const { name, re } of PATTERNS) {
        if (re.test(text)) {
          violations.push({ file: rel, line: i + 1, text: text.trim(), rule: name });
        }
      }
    });
  }
}

const globalsCss = readFileSync(GLOBALS_CSS, "utf8");
const rootBlockMatch = globalsCss.match(/:root\s*\{([\s\S]*?)\}/);
if (!rootBlockMatch) {
  violations.push({
    file: "app/globals.css",
    line: 0,
    text: ":root { ... }",
    rule: "missing-:root-block",
  });
} else {
  const rootBlock = rootBlockMatch[1];
  for (const varName of REQUIRED_ROOT_CSS_VARS) {
    if (!new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`).test(rootBlock)) {
      violations.push({
        file: "app/globals.css",
        line: 0,
        text: `${varName} 未在 :root 中定义`,
        rule: "missing-css-var",
      });
    }
  }
}

if (violations.length > 0) {
  console.error("lint-ui-tokens: 发现设计 token 违规：\n");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line}  ${v.text}`);
  }
  process.exit(1);
}

console.log("lint-ui-tokens: OK（无禁止 token 类，核心 CSS 变量已定义）");
