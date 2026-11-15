# Bounded load test (final build, 30 Oct 2026)

`npm -w @raksa/server run story:loadtest` (`server/src/story/loadtest.ts`) against an isolated server
(`PORT=4840`, DB copy, default limits: 100 participants/room, 20 active rooms) with the two DEMO scenarios published by
test identities. Simulated participants are Socket.IO clients in ONE Node process on the SAME machine as the server
(loopback network): this measures server processing and broadcast fan-out, not real mobile networks.

Machine: AMD Ryzen 7 9700X (8 cores / 16 threads), 33 GB RAM, Windows 11, Node v22.23.2.
Method per room: host opens choices 2 s into each scene and continues after the consequence minimum; each participant
answers a random option 0.5–8 s into the 30 s window (real server deadlines and scoring).

| Run | Rooms × participants | Rounds | Join p50/p95/max | Answer ack p50/p95/max | Answering-phase skew across participants (max) | Last answer → consequence p95 | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `r1-1x100.json` | 1 × 100 | 3 | 0 / 0 / 1 ms | 1 / 4 / 7 ms | 6 ms | 0 ms | 0 |
| `r2-5x40.json` | 5 × 40 (200) | 3 each | 1 / 1 / 7 ms | 1 / 3 / 5 ms | 2 ms | 4 ms | 0 |
| `r3-10x30.json` | 10 × 30 (300) | 2 each | 1 / 2 / 10 ms | 0 / 4 / 9 ms | 1 ms | 15 ms | 0 |

Interpretation: on this machine the server handled 300 concurrent participants in 10 simultaneous rooms with
millisecond-level synchronization and no errors. This is **not** an approved or production capacity figure: the real
event size (open question #1), the production host, real phones on Wi-Fi/cellular, TLS and the reverse proxy were not
tested. The configured limits (`STORY_MAX_PARTICIPANTS`, `STORY_MAX_ACTIVE_ROOMS`) remain local defaults.
