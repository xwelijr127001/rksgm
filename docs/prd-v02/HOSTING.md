# Hosting and raksaonline.com integration (local preparation only)

PRD DL #1 places the game inside raksaonline.com; the stack, hosting and security limits are **open question #3 (IT)**.
Nothing here was deployed and raksaonline.com was not touched. The build supports two shapes IT may choose, and both
were verified with a local stand-in parent site (`tools/harness-raksaonline/harness.mjs`, which is NOT raksaonline.com).

## 1. Path mount behind a reverse proxy (e.g. `https://raksaonline.com/game/`)

1. Build the client with the prefix (separate output folder, the root build is untouched):
   `VITE_BASE_PATH=/game/ VITE_OUT_DIR=dist-game npm -w @raksa/client run build`
2. Run the Node server with `CLIENT_DIST=client/dist-game`, `PUBLIC_BASE_URL=https://<host>/game` (used for QR/join links)
   and `TRUST_PROXY_HOPS=1` (one trusted proxy in front), so per-IP abuse limits see the real client address instead of the
   proxy's. Set it to the number of proxies that really sit in front (each appends the address it saw to
   `X-Forwarded-For`); with no proxy in front a client could forge its address, so leave it 0 then.
3. The proxy strips `/game` and forwards to the Node server, **including WebSocket upgrades** for `/game/socket.io/`.
   Apache example (not tested against the real site):
   ```apache
   ProxyPass        /game/socket.io/  ws://127.0.0.1:4000/socket.io/
   ProxyPass        /game/            http://127.0.0.1:4000/
   ProxyPassReverse /game/            http://127.0.0.1:4000/
   ```
What carries the prefix in the MVP client: router basename, `/api/*` fetches, the Socket.IO path, uploaded story assets
(`/aset-cerita/*`), Vite assets (JS/CSS/images, CSS `url()`), public music files. Implementation: `client/src/story/base.ts`.
Legacy features (`RAKSA_LEGACY=on`) still assume root hosting; they are outside the MVP.

## 2. Embedding in a page (iframe)

The server sends `Content-Security-Policy: frame-ancestors <FRAME_ANCESTORS>` on pages (default `'self'`, plus
`X-Frame-Options: SAMEORIGIN` in that default case). To allow raksaonline.com to frame the game:
`FRAME_ANCESTORS="'self' https://raksaonline.com"`. Values are validated (scheme/host/port, `'self'`, `'none'` only),
so the variable cannot inject other CSP directives (`server/src/hosting.test.ts`).

## 3. Local verification (`tools/uji-hosting-harness.mjs`, results in `evidence/hosting/`)

Game server on :4830 (`CLIENT_DIST=client/dist-game`, `FRAME_ANCESTORS=http://127.0.0.1:4890`,
`PUBLIC_BASE_URL=http://127.0.0.1:4890/game`, isolated DB copy) behind the harness on :4890. Checked: framing header,
prefixed `index.html`, API through the prefix, Socket.IO WebSocket through the proxy, landing inside the iframe, joining
and playing one round inside the iframe (answer → private consequence), no 4xx/5xx for prefixed assets, and a parent
page on a non-allowed origin (`localhost` instead of `127.0.0.1`) is blocked by the browser.

To repeat the check while another server serves `client/dist` (e.g. the owner's port 4100), never rebuild that folder
and do not reuse an old `client/dist-game`: build the prefixed client into a folder of its own outside the repo
(`VITE_OUT_DIR=<folder>/dist-game`), the server into `server/dist-uji`, and start the game server from those on a DB
copy (D-35); the commands are in the header of `tools/uji-hosting-harness.mjs`. The tool creates a room only when the
server behind the harness uses `PUBLIC_BASE_URL=<harness>/game`, and it plays the first published DEMO scenario.

## 4. Not verified / decisions for IT

- The real raksaonline.com stack and proxy (not known to this work — open question #3), TLS, proxy timeouts for
  WebSockets, sticky sessions (the room state lives in ONE Node process; multiple instances would need a shared adapter),
  CDN/cache headers, monitoring, backups of `data/` (SQLite + `aset-cerita/`), and production secrets.
- Single sign-on for staff, framing policy, privacy/retention text, and whether the game runs on a subdomain instead.
- Capacity: see `evidence/load/` for what was actually load-tested on one local machine; no production capacity is claimed.

## 5. Settings added by this work

| Variable | Default | Meaning |
| --- | --- | --- |
| `RAKSA_LEGACY` | off | `on` enables the pre-PRD features (solo story, Mini Games, legacy event quiz, Mandarin, Unity); off = their routes are not registered and their APIs/sockets are refused (D-03) |
| `TRUST_PROXY_HOPS` | 0 | trusted reverse proxies in front of Node (§1) |
| `FRAME_ANCESTORS` | `'self'` | who may frame the game (§2) |
| `STORY_MAX_PARTICIPANTS` | 100 | participants per room (local default, not an approved capacity — D-18) |
| `STORY_MAX_ACTIVE_ROOMS` | 20 | rooms open at the same time (same caveat) |
| `STORY_SEED` | on | at start the server publishes the scenarios that ship with the code (T-028: Episode 2 "Truk Trailer di Jalan Tol", `server/src/story/seed/publish.ts`) when they are not there yet; a start that finds the same content writes nothing; `off` skips it |
| `VITE_BASE_PATH`, `VITE_OUT_DIR` | `/`, `dist` | client build prefix and output folder (§1) |
| `STAFF_PASSWORD` | — | password for the staff provisioning CLI (`create`, `password`); only read from the environment, never from arguments (ROLES-AND-PROVISIONING.md) |

Existing settings keep their meaning (`PORT`, `HOST`, `PUBLIC_BASE_URL`, `DB_FILE`, `CLIENT_DIST`, …).
