## ADDED Requirements

### Requirement: Topic landing pages

The system MUST provide topic pages at `/topic/[slug]` for at least two MVP topics: emptiness (空性) and pure land (净土).

#### Scenario: Emptiness topic lists scriptures

- **WHEN** a user opens the emptiness topic slug
- **THEN** the page shows an introductory description
- **AND** an ordered list of linked scriptures configured for that topic

### Requirement: Scripture relations via tags

The system MUST associate scriptures with tags and display related scriptures on the reader page when tags exist.

#### Scenario: Related scriptures from tags

- **WHEN** a user views a scripture that has at least one tag linked to other scriptures
- **THEN** the reader page shows a related scriptures section with links to those scriptures

### Requirement: Topic content is data-driven

Topic titles, descriptions, and scripture membership MUST be stored in `topic` and `topic_item` tables, not hard-coded only in React components.

#### Scenario: Add topic item without code change

- **WHEN** an operator inserts a new `topic_item` row for an existing topic
- **THEN** the topic page lists the new scripture without redeploying frontend route code
