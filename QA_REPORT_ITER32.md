# QA Report — Iteration 32

## Changes
- Added persistent `nextRosterOrder` and per-name `swordInstanceCounters` to the save state.
- Established-honmaru starts (senior and random modes) shuffle the initial sword roster before assigning its stable roster order.
- Later custom sword additions and forge arrivals receive monotonic roster numbers and monotonic per-name instance numbers.
- Deleting a sword removes it from active lists but does not renumber surviving swords or recycle historical numbers. This avoids identity/record collisions in chat history, event ledgers, and save data.
- Added a character-directory search field covering name, sword type, role/department, relationship, affinity, status, location and roster number; displays result count and duplicate sword names.
- Service worker cache bumped to `honmaru-sim-v35`.

## Automated checks
- `node --check app.js`: PASS
- `node --check tests.js`: PASS
- `node --check standalone-check-iter32.js`: PASS
- `node tests.js`: 112 passed, 0 failed
- `node runtime_roster_search_smoke.js`: PASS (4 checks)
- `node runtime_autonomous_interaction_smoke.js`: PASS
- `node runtime_memory_retrieval_smoke.js`: PASS
- Standalone HTML rebuilt successfully.

## Limits
No real mobile browser/device session was available in this validation pass. No live API-key end-to-end request was performed. Tests are code regression and Node runtime smoke tests, not a claim of full browser QA.
