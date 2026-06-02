# corpus-quality (post-MVP delta)

## ADDED Requirements

### Requirement: Strip non-body preface from MVP canon
`corpus:gen` SHALL remove imperial prefaces before canonical body anchors (e.g. 觀自在菩薩 for T08n0251).

#### Scenario: Xinjing first paragraph
- **WHEN** xinjing.md is generated with default strip
- **THEN** first paragraph text contains 觀自在菩薩 and not 朕特述此

### Requirement: Xinjing colloquial coverage
After `seed:demo`, xinjing SHALL have ≥80% paragraphs with non-empty colloquial in corpus markdown.
