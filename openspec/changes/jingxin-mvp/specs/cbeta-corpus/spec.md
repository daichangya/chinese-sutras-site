## ADDED Requirements

### Requirement: Import CBETA TEI P5 into SQLite

The system MUST provide an offline import script that reads CBETA XML P5 files and populates `sutra`, `chapter`, and `paragraph` tables in SQLite.

#### Scenario: Import heart sutra successfully

- **WHEN** the operator runs the import script against `T08n0251.xml`
- **THEN** one `sutra` row exists with `cbeta_id` `T08n0251`
- **AND** at least one `paragraph` row exists with non-empty `text`
- **AND** paragraph `seq` values are contiguous starting at 1 per chapter

### Requirement: Expose CBETA metadata on scripture records

Each imported `sutra` MUST store `cbeta_id`, `title`, `translator`, `category`, and `char_count` derived from XML metadata.

#### Scenario: Scripture detail shows translator

- **WHEN** a user opens a scripture imported from CBETA
- **THEN** the page displays the translator field when present in source metadata

### Requirement: Display CBETA attribution

Every scripture page and the site footer MUST include a link or text referencing CBETA copyright terms.

#### Scenario: Footer attribution visible

- **WHEN** a user views any page on the site
- **THEN** the footer contains CBETA attribution text and link to https://www.cbeta.org/copyright.php

### Requirement: Handle rare characters (gaiji)

The reader MUST render CBETA rare characters using bundled or linked CBETA supplement fonts, with a visible fallback when a glyph cannot be rendered.

#### Scenario: Gaiji fallback displayed

- **WHEN** paragraph text contains an unrenderable gaiji code point
- **THEN** the UI shows a fallback marker rather than a blank tofu box without explanation
