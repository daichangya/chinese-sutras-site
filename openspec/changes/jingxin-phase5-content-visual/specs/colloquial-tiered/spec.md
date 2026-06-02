# colloquial-tiered

## ADDED Requirements

### Requirement: Tiered colloquial coverage

The system SHALL generate colloquial text in corpus markdown according to per-sutra tiers: core (full text, ≥80% coverage), intro (first 50 paragraphs, ≥70%), long (chapter_seq=0 first 50, ≥70%).

#### Scenario: Batch and check

- **WHEN** operator runs `npm run colloquial:batch` then `npm run colloquial:check`
- **THEN** each MVP slug reports PASS against its tier minimum
