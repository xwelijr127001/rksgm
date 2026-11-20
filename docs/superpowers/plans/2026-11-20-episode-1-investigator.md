# Episode 1 · Investigator (pilot) Implementation Plan

> Executed by the Orca team cards. Owner rule: NO tests / e2e / browser runs; gate = typecheck + rebuild client/dist; workers do not
> commit; the Lead commits, pushes, deploys. Spec: docs/superpowers/specs/2026-11-20-episode-1-investigator-design.md

**Goal:** a 5-minute investigator pilot episode `auto-2-inv` reusing the truck case art and arenas, with notebook, evidence cards,
KEBERATAN, verdict, message, 100-pt score, grade, device-saved stamps and ranks. Full Episode 1 and Episode 1 Dev unchanged.

## Global constraints
- Big text like Episode 1 Dev (`tampilan.teksBesar`), tap only, every step fits 360x640 / 390x700 without page scroll.
- No hearts, no timers; a miss never blocks progress. id/en/zh for every string.

## Review focus
- Reload mid-case resumes cleanly; saves never leak between auto-2, auto-2-dev, auto-2-inv.
- Confront: a card not yet collected cannot be chosen; the correct card is always collected on the required path.
- Replay keeps the BEST score; total = sum of best scores; "Tamu baru" clears only this mode's record.
- Long names and an empty name ("Tamu") on the result card.

### Task 1 (Fullstack, T-076): episode, state, scoring, saves, routing
Files: create `client/src/cerita/episode/auto-2-inv/{episode.ts,teks.ts,teks.id.ts,teks.en.ts,teks.zh.ts}`,
`client/src/cerita/investigasi/{status.ts,skor.ts,simpan.ts}`; modify `cerita/episode/index.ts`, `cerita/tipe.ts` (opt-in fields),
`App.tsx` (`/cerita/investigator`), `pages/Cerita.tsx` + server config/index + appConfig (flag RAKSA_INVESTIGATOR, default off), and
the phone player where the new node kinds plug in.
Interfaces (Produces, used by Task 2's components):
- `type Bukti = { id: 'dashcam' | 'rambu' | 'sim'; judul: KunciTeks; sumber: KunciTeks; ikon: 'rekaman' | 'foto' | 'kartu' }`
- `type Pernyataan = { id: string; siapa: 'darto' | 'petugasTol'; teks: KunciTeks }`
- `type HasilKeberatan = 'tepat' | 'tepat-kedua' | 'dipandu'`
- `skorKasus(h: { keberatan: HasilKeberatan; putusan: 'layak' | 'tambahan' | 'polis'; pesan: 'baik' | 'datar' | 'janji' })` returns
  `{ bukti: 40 | 25 | 10; putusan: 30 | 15 | 0; penanganan: 30 | 15 | 0; total: number; nilai: 'S' | 'A' | 'B' | 'C' }`
  (S >= 90, A >= 75, B >= 50, else C).
- Device record `{ versi: 1; terbaik: Record<string, number>; stempel: string[] }` under key `raksa:investigasi:v1`;
  `pangkat(stempel: number)` returns `'muda' | 'investigator' | 'senior' | 'kepala'` (0 / >= 1 / >= 3 / >= 4); `tamuBaru()` clears it.
- Episode graph node kinds: `catat` (pin a statement), `bukti` (grant a card after an arena), `keberatan`, `putusan`,
  `hasil-investigasi`; reuse kdash (dashcam), the road-sign photo as a card from the dashcam frame, and ksim (short) from auto-2.
Steps: types + flag/route/card · episode graph + texts per spec · status/scoring/saves · wire Task 2 components by these props (if not
there yet, render a plain placeholder with the same props) · typecheck 0, rebuild dist, HANDOFF "## T-076".

### Task 2 (Designer, T-077): investigator UI + assets
Files: create `client/src/cerita/investigasi/ui/{JudulKasus.tsx,BukuCatatan.tsx,KartuBukti.tsx,LayarKeberatan.tsx,CapKeberatan.tsx,
LayarPutusan.tsx,HasilInvestigasi.tsx,investigasi.css}`, pixel art under `cerita/seni/investigasi/`, sources in
`character/investigator-t077/`; modify `KartuPetugas.tsx` (opt-in stamps row + rank badge) and audio (one "keberatan" SFX, CC0 or synth).
Props (Consumes Task 1 types): `JudulKasus {nomor, judul, onMulai}` · `BukuCatatan {pernyataan: Pernyataan[]; bukti: Bukti[]}` ·
`KartuBukti {bukti, terpilih?, sorot?, onPilih?}` · `LayarKeberatan {pernyataan: Pernyataan; bukti: Bukti[]; percobaan: 0 | 1 | 2;
onPilih(id)}` · `CapKeberatan {onSelesai}` · `LayarPutusan {onPilih('layak' | 'tambahan' | 'polis')}` · `HasilInvestigasi {skor, nama,
look, stempel: string[], pangkat, onMainLagi, onKasusBerikutnya}`.
Assets: case title card, statement glow + pin, detective notebook, evidence card frame + 3 icons, KEBERATAN stamp (shake/flash;
reduced motion = still), reactions (petugas tol "kaget"/"mengaku", Darto "lega", Miss Raksa "berpikir"/"bangga"), verdict cards,
S/A/B/C badges, 4 rank badges, case stamp on the officer card. Fit 360x640 by calculation; previews in character/investigator-t077/;
typecheck 0, rebuild dist, HANDOFF "## T-077".
