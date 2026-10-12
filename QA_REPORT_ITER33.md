# QA Report — Iteration 33

## Baseline and scope
- Baseline: Iteration 32 ZIP and the same `worldbook-original.docx` as the Library copy.
- This is a new iteration; the original Iteration 32 package is not overwritten.

## Changes
1. **Sword roster numbering now compacts after deletion.** The displayed `rosterOrder` is derived from current roster order. Deleting the second sword renumbers the former third sword to second, and so on. New arrivals append to the end.
2. **Person identity remains stable.** Per-person IDs, relationship data, affection, conversation/event memory and same-name `forgeInstance` counters are independent of visible roster position.
3. **BGM source file added.** The uploaded file is included at `assets/default-bgm-source.mflac0.flac`.
4. Added a user-facing playback decode error; updated README to state the source limitation and kept the official music-page shortcut absent.
5. Service worker cache updated to `honmaru-sim-v36`. Rebuilt `standalone.html`.

## Tests
- Automated regression suite: **113 passed, 0 failed**.
- `node --check app.js`: PASS.
- `node --check tests.js`: PASS.
- `node --check runtime_roster_search_smoke.js`: PASS.
- `node --check standalone-check-iter33.js`: PASS.
- Eight runtime smoke suites: PASS (forge, custom-story reaction, continuity/memory, click effects, mobile end-day, autonomous interactions, memory retrieval, roster deletion/reindex).
- Roster runtime checks confirm deletion of the second item moves the former third item into position two while retaining its same-name instance number, affection and memory.

## BGM limitation — not a pass
The uploaded file has no standard `fLaC` file signature and FFmpeg cannot read valid audio frames. It appears to be an encrypted/platform-specific wrapper (filename suffix `.mflac0.flac`). It is included unchanged for traceability, but **cannot currently be used as playable built-in BGM**. No attempt was made to bypass platform encryption. A normal, DRM-free MP3/M4A/OGG/FLAC file is required to finish default playback.

## Not verified
- Real Android device testing and full browser UI end-to-end testing.
- Real API provider requests.
- Full game-worldbook conformance beyond existing regression/smoke coverage.
