# reader-ux (post-MVP delta)

## ADDED Requirements

### Requirement: Chapter pagination for large sutras
The system SHALL load at most one chapter_seq worth of paragraphs per reader request when total paragraphs exceed 300 or multiple chapter_seq values exist.

#### Scenario: Navigate fahuajing volumes
- **WHEN** user opens `/sutra/fahuajing?chapter=1`
- **THEN** only paragraphs with `chapter_seq=1` are rendered

### Requirement: Shareable daily verse page
The system SHALL provide `/verse/today` with card layout and dynamic OG image.

#### Scenario: Social preview
- **WHEN** crawler requests `/verse/today/opengraph-image`
- **THEN** a 1200x630 image is returned with verse text
