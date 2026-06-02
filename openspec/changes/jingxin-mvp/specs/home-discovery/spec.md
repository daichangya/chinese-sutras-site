## ADDED Requirements

### Requirement: Home page discovery

The home page MUST display today's verse, a search input, and a list of popular scriptures (at least 8 entries).

#### Scenario: Home lists popular scriptures

- **WHEN** a user opens `/`
- **THEN** the page shows a search field
- **AND** at least eight scripture links labeled as popular classics

### Requirement: Daily verse with AI summary

The system MUST show a daily verse on the home page and provide a short AI-generated interpretation, cached per day.

#### Scenario: Daily verse displays interpretation

- **WHEN** a user opens the home page on a day with configured daily verse
- **THEN** the verse text is visible
- **AND** an AI interpretation section is visible or loading

### Requirement: Shareable daily verse page

The system MUST provide `/verse/today` with Open Graph metadata suitable for social sharing.

#### Scenario: OG tags present

- **WHEN** a crawler requests `/verse/today`
- **THEN** the HTML contains `og:title` and `og:description` meta tags
