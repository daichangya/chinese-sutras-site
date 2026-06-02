## 1. Project scaffold (Week 1)

- [x] 1.1 Initialize Next.js 15 App Router project with TypeScript, Tailwind, shadcn/ui
- [x] 1.2 Add Drizzle ORM, better-sqlite3, and `DATA_DIR` env convention
- [x] 1.3 Define Drizzle schema: sutra, chapter, paragraph, paragraph_fts, tag, sutra_tag, topic, topic_item, daily_verse, ai_explanation_cache, user_bookmark
- [x] 1.4 Implement `lib/cbeta/parser.ts` with Vitest fixture for T08n0251.xml
- [x] 1.5 Implement `scripts/import-cbeta.ts` for MVP 12 scriptures list
- [x] 1.6 Run import locally and verify FTS5 index rebuild script (`seed:demo` + `fts:rebuild` when CBETA clone unavailable)
- [x] 1.7 Add site layout, footer CBETA attribution, and `/` home skeleton

## 2. Reader and search (Week 2)

- [x] 2.1 Build `/sutra/[slug]` reader with paragraph rendering and metadata header
- [x] 2.2 Implement reading preferences (dark mode, font size, line height) with localStorage persistence
- [x] 2.3 Add scroll-based reading progress indicator
- [x] 2.4 Implement `lib/search/fts.ts` and `/search` results page with snippets
- [x] 2.5 Add empty search state with popular scripture links
- [x] 2.6 Integrate CBETA supplement font CSS and gaiji fallback component

## 3. AI and daily verse (Week 3)

- [x] 3.1 Implement `lib/ai/gateway.ts` against existing AI Gateway env vars
- [x] 3.2 Add `POST /api/ai/explain` with cache read/write and disclaimer component
- [x] 3.3 Build selection side panel with three tabs (modern, background, life)
- [x] 3.4 Add colloquial generation script and manual review note for heart/diamond sutras
- [x] 3.5 Implement original/vernacular toggle in reader
- [x] 3.6 Implement `daily_verse` seed data, `POST /api/ai/daily`, home section, and `/verse/today` with OG tags

## 4. Topics, bookmarks, deploy (Week 4)

- [x] 4.1 Seed emptiness and pure-land topics with topic_item rows and topic pages
- [x] 4.2 Seed tags and sutra_tag relations; show related scriptures on reader
- [x] 4.3 Implement localStorage bookmarks list for scriptures and paragraphs
- [x] 4.4 Add `/bookmarks` page and bookmark actions on reader
- [x] 4.5 Document VPS deploy: standalone build, pm2, Caddy, DATA_DIR volume, sqlite backup cron
- [x] 4.6 Add Playwright E2E: home → heart sutra → selection explain → search
- [x] 4.7 Add AI golden-set JSON fixtures for 20 phrases (CI optional nightly)

## 5. Verification

- [x] 5.1 Run Vitest unit tests for parser and FTS helpers
- [x] 5.2 Run Playwright E2E on staging VPS or local production build
- [x] 5.3 Verify CBETA attribution on all pages and about/copyright page content
