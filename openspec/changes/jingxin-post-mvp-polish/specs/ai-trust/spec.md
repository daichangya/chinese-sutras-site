# ai-trust (post-MVP delta)

## ADDED Requirements

### Requirement: Golden phrase regression in CI
`npm test` SHALL run golden phrase tests using `AI_MOCK=1` without external Gateway.

### Requirement: Daily verse refresh script
`npm run daily:refresh` SHALL seed today's verse and optionally call `/api/ai/daily`.
