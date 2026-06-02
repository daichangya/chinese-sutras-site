## ADDED Requirements

### Requirement: Full-text search across paragraphs

The system MUST index paragraph text in SQLite FTS5 and expose search at `/search?q=`.

#### Scenario: Search finds keyword in heart sutra

- **WHEN** a user searches for a term known to exist in the heart sutra imported corpus
- **THEN** results include the heart sutra title
- **AND** each result includes a text snippet containing the matched term

### Requirement: Search performance on MVP corpus

Search on the MVP corpus (12–20 scriptures) MUST return initial results within 1 second under normal VPS load.

#### Scenario: Timely search response

- **WHEN** a user submits a single-character Buddhist term present in multiple scriptures
- **THEN** the search results page renders within 1 second server-side

### Requirement: Empty search guidance

When no results match, the system MUST show friendly guidance and links to popular scriptures.

#### Scenario: No results helpful empty state

- **WHEN** a user searches for a string that matches no indexed paragraph
- **THEN** the page states that no results were found
- **AND** displays links to at least three popular scriptures
