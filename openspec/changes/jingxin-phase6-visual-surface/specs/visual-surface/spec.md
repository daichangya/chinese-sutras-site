# visual-surface

## Requirements

### Secondary page layout

- SHALL use `.jx-page` for topic, search, bookmarks, about, verse/today outer container.
- SHALL use `.jx-section-label` for section headings instead of ad-hoc tracking classes.

### Cards and lists

- Topic sutra list items SHALL use `.jx-sutra-card`.
- Search result items SHALL use `.jx-sutra-card`; empty-state popular sutras SHALL use card grid, not underline-only links.
- Bookmark list items SHALL use `.jx-sutra-card`.

### Search input

- Search form input SHALL use `.jx-input` with paper-elevated background and accent focus ring.

### Testability

- Topic page SHALL expose `data-testid="topic-sutra-list"`.
- Search page SHALL expose `data-testid="search-results"` or `search-empty`.
- Bookmarks page SHALL expose `data-testid="bookmarks-list"`.
