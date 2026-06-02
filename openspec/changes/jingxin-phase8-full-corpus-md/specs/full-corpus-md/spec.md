# full-corpus-md

## Requirements

### Discovery

- The system SHALL scan `CBETA_XML_DIR` recursively for `*.xml` files.
- Each file SHALL map to a `cbetaId` parsed from the filename consistent with `resolveCbetaXmlPath` conventions.

### Generation output

- Output SHALL live under `CORPUS_FULL_DIR` (default `corpus-full`), not `corpus/sutras`.
- Each text SHALL produce Markdown with YAML frontmatter, `## 原文`, and empty `## 白话` sections matching MVP corpus format.
- Long texts SHALL use the same paragraph chunking thresholds as MVP gen (200 paragraphs / 80k chars per file).

### Catalog

- After generation, `corpus-full/catalog.json` SHALL list each text with cbetaId, slug, title, status, file paths, and paragraph count.

### CLI

- `corpus:gen:full` SHALL support `--limit`, `--resume`, `--slug`, and `--clean-stale`.
- Failures on individual texts SHALL NOT abort the full run; errors SHALL be logged to `logs/gen-errors.jsonl`.

### Repository

- Generated files under `corpus-full/sutras/` SHALL be gitignored.
- MVP `corpus/sutras/` and `MVP_CANON` behavior SHALL remain unchanged.
