# corpus-completeness

## Requirements

### Corpus generation

- `corpus:gen` SHALL support `--clean-stale` to remove markdown files under a slug not written in the current run.
- Generation SHALL preserve existing colloquial by pid unless `--force` is passed.

### Refresh pipeline

- `corpus:refresh` SHALL run: gen (with clean-stale), colloquial batch (AI_MOCK), import, seed:topics, seed:daily, audit summary.

### Audit and gates

- `corpus:audit` SHALL report per MVP slug: xml resolved, file count, paragraph count, chapter count.
- Vitest `mvp-corpus-completeness` SHALL assert each slug meets `MVP_MIN_PARAGRAPHS`.
- `colloquial:check` SHALL pass for all tier slugs after refresh.
