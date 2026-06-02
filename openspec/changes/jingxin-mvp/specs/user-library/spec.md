## ADDED Requirements

### Requirement: Bookmark scripture

A user MUST be able to bookmark an entire scripture for later access from a bookmarks list.

#### Scenario: Bookmark scripture locally

- **WHEN** a user clicks bookmark on a scripture page without server account
- **THEN** the scripture id is stored in browser local storage
- **AND** the bookmarks list page shows that scripture

### Requirement: Bookmark paragraph

A user MUST be able to bookmark a specific paragraph while reading.

#### Scenario: Bookmark paragraph locally

- **WHEN** a user bookmarks the current paragraph from the reader
- **THEN** the bookmark entry includes scripture id and paragraph id
- **AND** opening the bookmark navigates to that paragraph location

### Requirement: Schema ready for server-side bookmarks

The database schema MUST include `user_bookmark` table with columns for target type (scripture|paragraph), target ids, and optional user id for future authentication.

#### Scenario: Migration table exists

- **WHEN** Drizzle migrations are applied on a fresh database
- **THEN** the `user_bookmark` table exists with nullable `user_id`
