# visual-tokens

## ADDED Requirements

### Requirement: Immersive reading tokens

The application SHALL expose CSS design tokens for paper background, reading measure, and AI sidebar styling on home and reader pages.

#### Scenario: Reader AI panel

- **WHEN** user opens a sutra reader page
- **THEN** an element with `data-testid="reader-ai-panel"` is visible

#### Scenario: Popular sutra grid

- **WHEN** user opens the home page with imported corpus
- **THEN** `data-testid="popular-sutra-grid"` displays MVP sutra cards
