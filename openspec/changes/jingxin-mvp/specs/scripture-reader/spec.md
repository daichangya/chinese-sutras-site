## ADDED Requirements

### Requirement: Render scripture reading view

The system MUST provide a reading page at `/sutra/[slug]` that displays scripture title, metadata, and ordered paragraphs.

#### Scenario: Open heart sutra reader

- **WHEN** a user navigates to the heart sutra slug URL
- **THEN** the reader displays the scripture title and full paragraph text in reading order

### Requirement: Reading appearance preferences

The reader MUST support dark mode, font size (at least 3 levels), and line height (at least 3 levels), persisted in browser local storage.

#### Scenario: Font size persists across reload

- **WHEN** a user sets font size to the largest level and reloads the page
- **THEN** the reader applies the largest font size without reset

### Requirement: Reading progress indicator

The reader MUST show scroll-based reading progress for the current scripture session.

#### Scenario: Progress updates on scroll

- **WHEN** a user scrolls past the midpoint of a long scripture
- **THEN** the progress indicator reflects a value greater than 50%

### Requirement: Toggle original and vernacular text

The reader MUST allow switching between original `paragraph.text` and vernacular `paragraph.colloquial` when colloquial content exists.

#### Scenario: Vernacular toggle shows colloquial

- **WHEN** a user enables vernacular mode on a paragraph with `colloquial` populated
- **THEN** the reader displays the colloquial text instead of the original text for all paragraphs that have colloquial

#### Scenario: Vernacular toggle unavailable without content

- **WHEN** no paragraph in the scripture has `colloquial` content
- **THEN** the vernacular toggle is disabled or hidden with an explanatory hint
