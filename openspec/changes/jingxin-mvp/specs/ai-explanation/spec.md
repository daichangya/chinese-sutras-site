## ADDED Requirements

### Requirement: Explain user text selection

When a user selects text in the reader, the system MUST offer three explanation tabs: modern explanation, historical background, and life application.

#### Scenario: Modern explanation on selection

- **WHEN** a user selects a phrase in the reader and opens the modern explanation tab
- **THEN** the side panel displays generated modern-language explanation content within 30 seconds or shows a non-blocking error message

### Requirement: Cache AI explanations

The system MUST cache explanation responses keyed by selection text, paragraph context, tab type, and model version to avoid duplicate Gateway calls.

#### Scenario: Cached explanation returns immediately

- **WHEN** a user requests the same explanation for an identical selection and tab twice
- **THEN** the second response is served from cache without calling the Gateway

### Requirement: AI disclaimer

All AI-generated content MUST display a disclaimer that AI assistance does not replace formal Dharma teaching.

#### Scenario: Disclaimer visible with explanation

- **WHEN** an explanation is shown in the side panel
- **THEN** the disclaimer text is visible in the same panel

### Requirement: Gateway integration without embedded keys in client

The browser MUST NOT call the AI Gateway directly; explanation requests MUST go through server Route Handlers.

#### Scenario: No client-side API key

- **WHEN** inspecting network traffic from the reader page during explanation
- **THEN** no AI Gateway API key is present in client-side JavaScript bundles or requests

### Requirement: Vernacular generation for MVP scriptures

An offline or server script MUST be able to populate `paragraph.colloquial` for MVP scriptures via the Gateway, with manual review documented for heart and diamond sutras.

#### Scenario: Heart sutra has colloquial paragraphs

- **WHEN** the colloquial generation pipeline has been run for the heart sutra
- **THEN** at least 80% of heart sutra paragraphs have non-empty `colloquial` fields
