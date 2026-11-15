# Internal roles and provisioning (PRD FR-E3)

Participants never have accounts (room code + name + a room-scoped reconnect credential stored on their device).
Staff use separate internal accounts. There are **no default accounts and no built-in credentials**.

## Roles and capabilities

Source of truth: `shared/story/roles.ts` (`CAPABILITIES`). Checked by the server on every REST route
(`server/src/story/http.ts`, `requireCap`) and every host socket event (`server/src/story/socket.ts`); the UI only hides
what a role cannot use.

| Role (`id`) | Can | Cannot |
| --- | --- | --- |
| Host room (`host`) | open rooms from published scenarios, start/continue/auto-advance, remove participants, close rooms; see own room list | read or edit scenario content, see reports |
| Penulis konten (`author`) | create/edit drafts, preview, submit for review, read assets & scenarios | open rooms, publish, upload assets, see reports |
| Reviewer / komite (`reviewer`) | read scenarios, return to draft, record anonymization check, publish (not own work), archive, withdraw versions | edit drafts, open rooms |
| Panitia kompetisi (`competition_admin`) | dashboard, cross-room results + CSV, round analytics, rooms (and closing a live room whose host is gone), periods (create/edit), audit log | content, opening/hosting rooms, users |
| Admin sistem (`system_admin`) | users & roles, asset library (upload/metadata/archive), categories, audit log, read scenarios, archive/unarchive | open rooms, edit or publish content, see competition results |

Roles can be combined deliberately (e.g. `author` + `reviewer` for a small team), but the four-eyes rule still blocks a
reviewer from publishing a scenario they submitted or last edited. Role changes, activation and password resets are
audited; deactivation and password changes revoke the user's sessions.

## Creating the first system admin (CLI)

Run on the server host (same `DB_FILE` as the server). The password comes from an environment variable so it never
appears in shell history:

```bash
# PowerShell
$env:STAFF_PASSWORD = '<kata sandi kuat, min. 10 karakter>'
npm run staff -- create --username admin.sistem --name "Admin Sistem" --roles system_admin
Remove-Item Env:STAFF_PASSWORD

# bash
STAFF_PASSWORD='<…>' npm run staff -- create --username admin.sistem --name "Admin Sistem" --roles system_admin
```

Other CLI commands: `npm run staff -- list`, `roles --username u --roles host,author`,
`password --username u` (with `STAFF_PASSWORD`), `deactivate --username u`.
After the first admin exists, further accounts are created in the browser at **/admin → Pengguna & peran**.

## Local test identities (development only)

`npm run story:dev-setup` (refuses `NODE_ENV=production`) creates five clearly labelled test identities —
`uji.admin`, `uji.penulis`, `uji.reviewer`, `uji.host`, `uji.panitia` — with random passwords written to
`<data folder>/dev-staff-credentials.json` (git-ignored), and the two synthetic demo scenarios as drafts.
`-- --publish-demo` submits/publishes them with the test identities: this is a **simulated approval**, not committee
approval. `-- --period` adds a labelled local test period. Never run it against a production database.

## Sessions and security notes

- Passwords: scrypt (random salt), constant-time comparison; minimum 10 characters.
- Sessions: random 32-byte bearer token, only its SHA-256 is stored; 12-hour expiry; logout revokes.
- Failed logins are rate-limited (10 per IP+username, 50 per IP, per 10 minutes); participant lookups are limited by
  failed guesses per IP (30 per 5 minutes) so a whole event behind one office NAT can still join and reconnect.
- The browser keeps the staff token in `sessionStorage` (closing the tab signs out).
- When a session ends while the CMS is open (expiry, deactivation, password reset), the next request answered 401 shows
  a sign-in dialog over the CMS: the same account continues with its unsaved edits; another account restarts the CMS,
  so unsaved work never passes to another staff member. Host and admin tools show the sign-in page instead.

## What IT still has to decide (open question #3)

Single sign-on with the raksaonline.com identity provider, password policy/MFA, hosting of the user store, and who
operates accounts are not decided. The local account system can be replaced behind the same capability checks
(`authenticate()` in `server/src/story/auth/staff.ts`).
