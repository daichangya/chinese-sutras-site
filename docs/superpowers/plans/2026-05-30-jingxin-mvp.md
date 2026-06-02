# jingxin MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 4-week MVP of jingxin — a modern Buddhist scripture reading & understanding site backed by CBETA paragraphs in SQLite on a single VPS.

**Architecture:** Next.js 15 App Router monolith; `better-sqlite3` + Drizzle; FTS5 on `paragraph`; CBETA TEI import via offline script; AI only through server Route Handlers to your existing Gateway. No ES/Neo4j/Redis.

**Tech Stack:** Next.js, TypeScript, Tailwind, shadcn/ui, Drizzle ORM, better-sqlite3, Vitest, Playwright

**Spec sources:**
- [2026-05-30-jingxin-reader-design.md](../specs/2026-05-30-jingxin-reader-design.md)
- [openspec/changes/jingxin-mvp/](../../openspec/changes/jingxin-mvp/)

---

## Target file tree (end state)

```text
jingxin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # home
│   ├── search/page.tsx
│   ├── sutra/[slug]/page.tsx
│   ├── topic/[slug]/page.tsx
│   ├── verse/today/page.tsx
│   ├── bookmarks/page.tsx
│   ├── about/page.tsx
│   └── api/ai/explain/route.ts
│       └── api/ai/daily/route.ts
├── components/
│   ├── layout/site-footer.tsx
│   ├── reader/reader-shell.tsx
│   ├── reader/selection-panel.tsx
│   ├── reader/gaiji-text.tsx
│   └── search/search-results.tsx
├── lib/
│   ├── db/index.ts
│   ├── db/schema.ts
│   ├── cbeta/parser.ts
│   ├── cbeta/mvp-canon.ts
│   ├── search/fts.ts
│   ├── ai/gateway.ts
│   ├── ai/prompts.ts
│   └── bookmarks/storage.ts
├── scripts/
│   ├── import-cbeta.ts
│   ├── rebuild-fts.ts
│   └── generate-colloquial.ts
├── drizzle/
├── data/.gitkeep                  # jingxin.db gitignored
├── tests/
│   ├── fixtures/T08n0251.xml
│   ├── cbeta/parser.test.ts
│   └── search/fts.test.ts
├── e2e/home-reader.spec.ts
├── docs/deploy/vps.md
├── .env.example
└── package.json
```

---

## Environment variables

```bash
# .env.example
DATA_DIR=./data
DATABASE_URL=file:./data/jingxin.db
AI_GATEWAY_URL=https://your-gateway/v1/chat/completions
AI_GATEWAY_API_KEY=
AI_MODEL=deepseek-chat
CBETA_XML_DIR=./vendor/xml-p5
```

Gateway adapter in `lib/ai/gateway.ts` MUST match your real HTTP contract — adjust path/body in Task 3.1 after reading your gateway docs.

---

## MVP canon (import list)

Define once in `lib/cbeta/mvp-canon.ts`:

| slug | cbeta_id | title |
|------|----------|-------|
| xinjing | T08n0251 | 般若波羅蜜多心經 |
| jingangjing | T08n0235 | 金剛般若波羅蜜經 |
| dizangjing | T13n0412 | 地藏菩薩本願經 |
| amituojing | T12n0366 | 佛說阿彌陀經 |
| fahuajing | T09n0262 | 妙法蓮華經 |
| liangyanjing | T19n0945 | 大佛頂首楞嚴經 |
| liuzutanjing | T48n2008 | 六祖大師法寶壇經 |
| weimojiejing | T14n0475 | 維摩詰所說經 |
| zhonglun | T30n1564 | 中論 |
| wuliangshoujing | T12n0360 | 佛說無量壽經 |
| guanwuliangshoujing | T12n0365 | 佛說觀無量壽佛經 |

Large texts: import full XML but reader loads by `chapter` pagination (lazy fetch via `?chapter=` query).

---

### Task 1: Repository bootstrap

**Files:**
- Create: entire Next.js app at repo root
- Create: `.gitignore`, `.env.example`, `README.md`

- [ ] **Step 1: Init git and Next.js**

```bash
cd /Users/changyadai/IdeaProjects/jingxin
git init
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --turbopack
```

Expected: `package.json` with `next` 15.x

- [ ] **Step 2: Add core dependencies**

```bash
npm i drizzle-orm better-sqlite3 uuid
npm i -D drizzle-kit @types/better-sqlite3 vitest @vitejs/plugin-react tsx @playwright/test
npx shadcn@latest init -y
npx shadcn@latest add button tabs sheet scroll-area
```

- [ ] **Step 3: Add npm scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx scripts/migrate.ts",
  "import:cbeta": "tsx scripts/import-cbeta.ts",
  "fts:rebuild": "tsx scripts/rebuild-fts.ts",
  "e2e": "playwright test"
}
```

- [ ] **Step 4: `.gitignore` entries**

```
data/*.db
data/*.db-*
vendor/xml-p5/
.env
node_modules/
.next/
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: bootstrap Next.js app for jingxin"
```

---

### Task 2: Database schema (Drizzle + SQLite)

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `scripts/migrate.ts`

- [ ] **Step 1: Write schema** — `lib/db/schema.ts`

```typescript
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const sutra = sqliteTable("sutra", {
  id: text("id").primaryKey(),
  cbetaId: text("cbeta_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  translator: text("translator"),
  category: text("category"),
  charCount: integer("char_count").default(0),
});

export const chapter = sqliteTable("chapter", {
  id: text("id").primaryKey(),
  sutraId: text("sutra_id").notNull().references(() => sutra.id),
  seq: integer("seq").notNull(),
  title: text("title"),
});

export const paragraph = sqliteTable("paragraph", {
  id: text("id").primaryKey(),
  sutraId: text("sutra_id").notNull().references(() => sutra.id),
  chapterSeq: integer("chapter_seq").notNull().default(0),
  seq: integer("seq").notNull(),
  text: text("text").notNull(),
  colloquial: text("colloquial"),
}, (t) => [index("paragraph_sutra_seq").on(t.sutraId, t.chapterSeq, t.seq)]);

export const tag = sqliteTable("tag", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const sutraTag = sqliteTable("sutra_tag", {
  sutraId: text("sutra_id").notNull(),
  tagId: text("tag_id").notNull(),
});

export const topic = sqliteTable("topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
});

export const topicItem = sqliteTable("topic_item", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull(),
  sutraId: text("sutra_id").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const dailyVerse = sqliteTable("daily_verse", {
  id: text("id").primaryKey(),
  verseDate: text("verse_date").notNull().unique(),
  paragraphId: text("paragraph_id"),
  customText: text("custom_text"),
  aiSummary: text("ai_summary"),
});

export const aiExplanationCache = sqliteTable("ai_explanation_cache", {
  cacheKey: text("cache_key").primaryKey(),
  tab: text("tab").notNull(),
  content: text("content").notNull(),
  model: text("model"),
  createdAt: integer("created_at").notNull(),
});

export const userBookmark = sqliteTable("user_bookmark", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  targetType: text("target_type").notNull(),
  sutraId: text("sutra_id"),
  paragraphId: text("paragraph_id"),
  createdAt: integer("created_at").notNull(),
});
```

- [ ] **Step 2: DB singleton** — `lib/db/index.ts`

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const dataDir = process.env.DATA_DIR ?? "./data";
const dbPath = path.join(dataDir, "jingxin.db");

export function getDb() {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  return drizzle(sqlite, { schema });
}
```

- [ ] **Step 3: Generate and run migration**

```bash
npx drizzle-kit generate
npm run db:migrate
```

`scripts/migrate.ts` runs SQL files + creates FTS virtual table:

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS paragraph_fts USING fts5(
  paragraph_id UNINDEXED,
  sutra_title,
  text,
  tokenize='unicode61'
);
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(db): drizzle schema and sqlite connection"
```

---

### Task 3: CBETA parser (TDD)

**Files:**
- Create: `tests/fixtures/T08n0251.xml` (copy from vendor after clone)
- Create: `lib/cbeta/parser.ts`
- Create: `tests/cbeta/parser.test.ts`

- [ ] **Step 1: Clone CBETA XML (dev only)**

```bash
mkdir -p vendor
git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5
cp vendor/xml-p5/T/T08/T08n0251.xml tests/fixtures/T08n0251.xml
```

- [ ] **Step 2: Write failing test** — `tests/cbeta/parser.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseCbetaFile } from "@/lib/cbeta/parser";

describe("parseCbetaFile", () => {
  it("parses heart sutra paragraphs", () => {
    const xml = readFileSync("tests/fixtures/T08n0251.xml", "utf-8");
    const result = parseCbetaFile(xml, "T08n0251");
    expect(result.title).toContain("心經");
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs[0].text.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
npm test -- tests/cbeta/parser.test.ts
```

- [ ] **Step 4: Implement minimal parser** — `lib/cbeta/parser.ts`

Use `@xmldom/xmldom` or `fast-xml-parser` to walk TEI `body//p` (and `lg` lines if needed). Strip notes. Return:

```typescript
export type ParsedSutra = {
  cbetaId: string;
  title: string;
  translator?: string;
  paragraphs: { chapterSeq: number; seq: number; text: string }[];
};
```

- [ ] **Step 5: Run test — expect PASS**

- [ ] **Step 6: Commit**

---

### Task 4: Import script + FTS rebuild

**Files:**
- Create: `lib/cbeta/mvp-canon.ts`
- Create: `scripts/import-cbeta.ts`
- Create: `scripts/rebuild-fts.ts`

- [ ] **Step 1: Implement import loop**

For each entry in `MVP_CANON`, resolve `vendor/xml-p5/**/{cbetaId}.xml`, parse, upsert `sutra`/`paragraph` with UUID v4 ids, stable slug.

- [ ] **Step 2: Run import**

```bash
CBETA_XML_DIR=./vendor/xml-p5 npm run import:cbeta
```

Expected stdout: `imported 11 sutras, N paragraphs`

- [ ] **Step 3: FTS rebuild** — `scripts/rebuild-fts.ts`

```sql
DELETE FROM paragraph_fts;
INSERT INTO paragraph_fts(paragraph_id, sutra_title, text)
SELECT p.id, s.title, p.text FROM paragraph p JOIN sutra s ON s.id = p.sutra_id;
```

- [ ] **Step 4: Manual verify**

```bash
sqlite3 data/jingxin.db "SELECT paragraph_id FROM paragraph_fts WHERE paragraph_fts MATCH '觀自在' LIMIT 3;"
```

- [ ] **Step 5: Commit**

---

### Task 5: Layout, footer, home skeleton

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/site-footer.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Footer with CBETA link** (spec: cbeta-corpus attribution)

- [ ] **Step 2: Home** — placeholder blocks: 今日经句、SearchForm、`PopularSutras` from DB query `ORDER BY char_count ASC` limit 12

- [ ] **Step 3: `app/about/page.tsx`** — CBETA 版权说明中文摘要

- [ ] **Step 4: Commit**

---

### Task 6: Reader page

**Files:**
- Create: `app/sutra/[slug]/page.tsx`
- Create: `components/reader/reader-shell.tsx`
- Create: `components/reader/gaiji-text.tsx`

- [ ] **Step 1: Server component loads sutra + paragraphs** by slug; 404 if missing

- [ ] **Step 2: Reader styles** — max-w-2xl mx-auto, `prose prose-lg dark:prose-invert`, generous `leading-relaxed`

- [ ] **Step 3: Preferences** — `localStorage` keys `jx-theme`, `jx-font`, `jx-leading`; apply CSS variables on `<html>`

- [ ] **Step 4: Progress bar** — `scroll` listener on container, set width %

- [ ] **Step 5: Chapter pagination** — if paragraph count > 200, only load one `chapterSeq` per request

- [ ] **Step 6: Commit**

---

### Task 7: Search

**Files:**
- Create: `lib/search/fts.ts`
- Create: `app/search/page.tsx`
- Create: `tests/search/fts.test.ts`

- [ ] **Step 1: `searchParagraphs(q: string, limit = 20)`** using parameterized FTS query + snippet

- [ ] **Step 2: Search page** with highlights and links `/sutra/[slug]#p-{seq}`

- [ ] **Step 3: Empty state** with popular sutras (spec: scripture-search)

- [ ] **Step 4: Vitest integration test** against imported DB (skip if no db in CI — document `CI: import first`)

- [ ] **Step 5: Commit**

---

### Task 8: AI Gateway + explain API

**Files:**
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/gateway.ts`
- Create: `app/api/ai/explain/route.ts`
- Create: `components/reader/selection-panel.tsx`

- [ ] **Step 1: `buildCacheKey(selection, paragraphId, tab, model)`**

- [ ] **Step 2: `gateway.chat(messages)`** — POST to `AI_GATEWAY_URL`, bearer `AI_GATEWAY_API_KEY`

- [ ] **Step 3: Prompts per tab** in `lib/ai/prompts.ts` with system rule: no fabricated citations

- [ ] **Step 4: Route handler** validates body, reads cache, returns `{ content, disclaimer, cached }`

- [ ] **Step 5: Selection panel** — `mouseup` → get selection → fetch three tabs lazily

- [ ] **Step 6: `AiDisclaimer` component** on every AI block

- [ ] **Step 7: Commit**

---

### Task 9: Vernacular toggle + generation script

**Files:**
- Create: `scripts/generate-colloquial.ts`
- Modify: reader for toggle

- [ ] **Step 1: Script** batches paragraphs without `colloquial`, calls Gateway, updates row

- [ ] **Step 2: Run for xinjing + jingangjing only** (MVP); document manual review in `docs/content-review.md`

- [ ] **Step 3: Toggle in reader** (spec: scripture-reader)

- [ ] **Step 4: Commit**

---

### Task 10: Daily verse

**Files:**
- Create: `app/verse/today/page.tsx`
- Create: `app/api/ai/daily/route.ts`
- Seed row in import or `scripts/seed-daily.ts`

- [ ] **Step 1: Seed `daily_verse` for today** pointing to a known paragraph

- [ ] **Step 2: Home section + `/verse/today`** with `generateMetadata` OG tags

- [ ] **Step 3: API generates summary if `ai_summary` null, then caches

- [ ] **Step 4: Commit**

---

### Task 11: Topics, tags, bookmarks

**Files:**
- Create: `scripts/seed-topics.ts`
- Create: `app/topic/[slug]/page.tsx`
- Create: `lib/bookmarks/storage.ts`
- Create: `app/bookmarks/page.tsx`

- [ ] **Step 1: Seed topics** `kongxing`, `jingtu` with topic_item rows

- [ ] **Step 2: Seed tags** `prajna`, `pure-land` and sutra_tag edges (xinjing–jingangjing–zhonglun)

- [ ] **Step 3: Related sutras block** on reader page

- [ ] **Step 4: localStorage bookmarks** `jx-bookmarks-v1` JSON array; `/bookmarks` page

- [ ] **Step 5: Commit**

---

### Task 12: VPS deploy doc + production build

**Files:**
- Create: `docs/deploy/vps.md`
- Modify: `next.config.ts` → `output: "standalone"`

- [ ] **Step 1: Document** pm2 ecosystem, Caddy reverse proxy, `DATA_DIR=/var/lib/jingxin`, cron backup:

```bash
0 3 * * * sqlite3 /var/lib/jingxin/jingxin.db ".backup /var/backups/jingxin-$(date +\%F).db"
```

- [ ] **Step 2: Verify `npm run build && npm run start`** with production DB path

- [ ] **Step 3: Commit**

---

### Task 13: E2E + golden set

**Files:**
- Create: `e2e/home-reader.spec.ts`
- Create: `tests/ai/golden-phrases.json`

- [ ] **Step 1: Playwright config** `baseURL: http://127.0.0.1:3000`

- [ ] **Step 2: E2E flow** home → click 心经 → select text → panel visible (mock Gateway in test via `AI_GATEWAY_URL` pointing to stub server OR `PLAYWRIGHT_SKIP_AI=1` checks panel skeleton only)

- [ ] **Step 3: Golden JSON** 20 phrases for manual/nightly AI regression script (document in README)

- [ ] **Step 4: Commit**

---

## Spec coverage checklist

| Capability | Tasks |
|------------|-------|
| cbeta-corpus | 3, 4, 5, 12 |
| scripture-reader | 6, 9 |
| scripture-search | 7 |
| ai-explanation | 8, 9 |
| home-discovery | 5, 10 |
| topic-catalog | 11 |
| user-library | 11 |

---

## Self-review (plan vs spec)

- VPS + SQLite: Task 2, 12 — covered
- No client Gateway keys: Task 8 — covered
- FTS not ES: Task 4, 7 — covered
- Tags not Neo4j: Task 11 — covered
- Open question: Gateway HTTP shape — called out in Task 8 Step 2

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-jingxin-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement task-by-task in this session with checkpoints  

Also available: `/opsx:apply` on change `jingxin-mvp` (tasks mirror this plan).

**Which approach do you want?** Say **「开始实现」** or pick 1/2 to proceed (implementation exits plan-only mode).
