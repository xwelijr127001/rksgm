# Kontrak implementasi client RAKSA GAME

Dokumen ini adalah **kontrak wajib**. Jangan mengubah file di luar daftar tugasmu.
Jangan mengubah `shared/`, `server/`, `theme.css`, `store.ts`, `audio.ts`, `hooks.ts`,
`ui/kit.tsx`, `App.tsx` kecuali diminta secara eksplisit.

## Stack

React 19.3 + TypeScript 7 (strict) + Vite 6. `jsx: react-jsx` (tidak perlu `import React`).
`react-router-dom` 7. Tidak ada library UI/animasi/CDN eksternal - semua ilustrasi SVG inline
dan audio disintesis (acara kantor bisa offline).

## Import alias

```ts
import type { MissionPublic, StepDef, ... } from '@shared/types';
import { MISSIONS, TUTORIAL_MISSION, TIEBREAK_MISSION } from '@shared/missions';
import { BRAND, DISCLAIMER, ACCESSORIES, UNIFORM_COLORS, SKIN_TONES, HAIR_COLORS } from '@shared/brand';
import { formatRupiah, scoreRound } from '@shared/scoring';
```

`@shared` = folder `shared/` di root repo. **Jangan** import `server/`.

## Aturan produk (wajib dipatuhi di semua halaman)

1. **Bahasa Indonesia** yang singkat, ramah, mudah dipahami. Hindari jargon.
2. **HP portrait dulu**: nyaman dari lebar 360px. Target sentuh minimal 44px
   (pakai `.btn`, `.kartu`, `.chip-tap` yang sudah 44px+).
3. **Tidak boleh mengandalkan hover**. Tidak boleh ada horizontal scroll tak sengaja
   (pakai `.geser-x` bila memang perlu geser).
4. **Status tidak hanya dibedakan warna** - selalu ada teks atau ikon pendamping.
5. **Loading / error / empty / reconnect** punya tampilan jelas (`<Memuat/>`, `<Pesan/>`, `.kosong`).
6. Hormati `prefers-reduced-motion` (theme.css sudah mematikan animasi CSS; untuk animasi
   yang digerakkan JS pakai `useReducedMotion()`).
7. **Jangan pernah menampilkan jawaban benar sebelum fase REVEAL.** Data `room.reveal`
   dari server bernilai `null` sebelum REVEAL - jangan mengarang kunci jawaban di client.
8. **Jangan menampilkan peserta/skor palsu** pada mode kompetisi. Data demo hanya boleh di
   mode latihan dan harus diberi label jelas.
9. Animasi tidak boleh menunda akses ke soal.

## Kelas CSS yang tersedia (theme.css)

Layout: `.layar .wrap .wrap-lebar .isi .stack .stack-s .stack-l .baris .baris-rapat .baris-antara
.grid-2 .grid-3 .tengah .kecil .mini .lembut .tebal .mono .sr-only .penuh .geser-x .aman-bawah
.dok-bawah .sembunyi`

Tombol: `.btn` (+ `.btn-utama .btn-garis .btn-bahaya .btn-netral .btn-blok .btn-kecil`)

Kartu/panel: `.panel .panel-krem .kartu` (+ `.terpilih .benar .salah`), `.kartu-ikon .kartu-teks
.kartu-tanda`

Lain: `.chip` (+`-hijau -kuning -merah -biru -tap`), `.label-produk`, `.topbar`, `.timer`,
`.timer-bar`, `.status-koneksi`, `.titik`, `.pesan` (+`-error -info -sukses -kuning`), `.kosong`,
`.memuat`, `.kolom`, `.kolom-kode`, `.label-kolom`, `.saklar`, `.tabel`, `.papan`,
`.papan-baris` (+ `.r1 .r2 .r3 .saya`), `.papan-peringkat`, `.papan-nama`, `.papan-poin`,
`.delta-naik`, `.delta-turun`, `.proyektor`

Animasi: `.anim-masuk .anim-skala .anim-stempel .anim-melayang .anim-denyut`

Token warna: `var(--kuning) var(--hijau) var(--hijau-muda) var(--hijau-pucat) var(--krem)
var(--krem-tua) var(--tinta) var(--tinta-lembut) var(--cokelat) var(--merah) var(--merah-pucat)
var(--biru) var(--biru-pucat) var(--putih)`; radius `--radius-s --radius --radius-l --radius-pill`;
`--tap --gutter --maxw --font --font-judul --shadow --shadow-s --shadow-l`.

CSS tambahan khusus halaman boleh ditulis inline (`style={{...}}`) atau `<style>{...}</style>`
di dalam komponen. Jangan membuat file .css baru.

## API state (`src/state/store.ts`)

```ts
useGame(): {
  status: 'connecting'|'connected'|'reconnecting'|'offline';
  room: RoomPublicState | null;   // snapshot server
  me: MePrivate | null;           // data privat pemain
  identity: { code, playerId, playerToken, nickname, look } | null;
  hostToken: string | null;
  role: 'host'|'player'|'spectator'|null;
  clockOffset: number;
  error: string | null;
  notice: string | null;
  kicked: boolean;
}

actions.hostCreate(eventName): Promise<{ok, code?, error?}>
actions.hostAttach(code, hostToken): Promise<boolean>
actions.hostAction(action, extra?): Promise<boolean>
  // action: 'startTutorial'|'startMatch'|'pause'|'resume'|'next'|'closeRound'|'end'|'reset'|'tiebreak'|'kick'
  // kick: actions.hostAction('kick', { playerId })
actions.hostSettings({eventName?, autoAdvance?, prizes?}): Promise<boolean>
actions.join(code, nickname, look): Promise<{ok, error?}>
actions.rejoin(code): Promise<{ok, error?}>
actions.updateLook(nickname, look): Promise<boolean>
actions.setReady(ready): Promise<void>
actions.submit(roundIndex, answer): Promise<{ok, duplicate?, error?}>
actions.spectate(code): Promise<{ok, error?}>
actions.requestState(code): Promise<boolean>
actions.leave(): void
actions.clearError(): void
actions.clearNotice(): void

savedLook(): PlayerLook
savedIdentity(code): Identity | null
savedHostToken(code): string | null
savedLastHostRoom(): string | null
savedLastPlayerRoom(): string | null
bootstrapHost(code?): Promise<boolean>
bootstrapPlayer(code?): Promise<boolean>
serverNow(): number
```

Timer **wajib** memakai `room.phaseEndsAt` + `room.phaseDurationMs` lewat `useCountdown`
(berbasis jam server). Jangan membuat hitung mundur sendiri dari `Date.now()`.

## API hooks (`src/hooks.ts`)

```ts
useCountdown(endsAt: number|null, durationMs: number|null): { remainingMs, seconds, ratio }
useAudioPrefs(): AudioPrefs
useReducedMotion(): boolean
useOnChange<T>(value, fn)
useLocalState<T>(key, initial): [T, (v:T)=>void]
```

## API audio (`src/audio/audio.ts`)

```ts
initAudio()                      // dipanggil otomatis oleh AudioUnlocker
setTrack('lobby'|'game'|'podium'|null)
playSfx('pilih'|'bukti'|'kirim'|'naik'|'salah'|'tik'|'papan'|'confetti'|'masuk')
preferMusicOn()                  // dipakai HANYA di /host dan /projector
setMuted / setMusicEnabled / setMusicVolume / setSfxVolume
```

Musik HP nonaktif secara default; jangan memanggil `preferMusicOn()` di halaman pemain.

## API UI kit (`src/ui/kit.tsx`)

```tsx
<BrandTitle size="besar"|"kecil" />
<Timer endsAt={n|null} durationMs={n|null} label?="" onZero?={fn} />
<TimerBar endsAt durationMs />
<PhaseBadge phase={Phase} />           phaseLabel(phase): string
<ConnectionBadge />
<Pesan jenis="error"|"info"|"sukses"|"kuning" onTutup?={fn}>...</Pesan>
<Memuat teks?="Memuat..." />
<Disclaimer />
<Modal judul onTutup aksi?={ReactNode}>...</Modal>
<TombolKonfirmasi label judul pesan onSetuju kelas? labelSetuju? disabled? />
<QrCode value={url} size?={220} label?={url} />
<KodeRoom code size?="besar"|"kecil" />
<PolicyCardView card={PolicyCard} aktif?={boolean} />
<DocTableView table={DocTable} />
<Leaderboard rows={LeaderRow[]} highlightId? limit? showAvatar? prizes? />
<Stempel teks?="Misi Selesai" />
<Confetti jumlah?={60} />
<AudioControls ringkas?={boolean} />
```

## API ilustrasi (`src/art/*`)

```tsx
// src/art/Icon.tsx
<Icon name={IconKey} size?={24} className?="" />        // IconKey ada di @shared/types

// src/art/Avatar.tsx
<Avatar look={PlayerLook} size?={64} mood?="senang"|"netral"|"fokus" className?="" />
// petugas Raksa kartun; aksesori: none|helm|jaket|headset|topi

// src/art/Raki.tsx  (pendamping burung hantu)
<Raki size?={96} mood?="sapa"|"bicara"|"senang"|"berpikir" className?="" />
<RakiBubble teks={string|ReactNode} mood? size? judul?={string} />

// src/art/Scene.tsx
<Scene scene={SceneKey} className?="">{children}</Scene>
// wadah <div style="position:relative"> berisi SVG adegan yang mengisi lebar penuh
// (rasio 400x260, preserveAspectRatio="xMidYMid slice"); children ditumpuk di atasnya
// dengan koordinat persen -> dipakai untuk hotspot.

// src/art/CityMap.tsx
<CityMap currentRound={number} completed={number[]} compact?={boolean} className?="" />
// peta kota isometrik dengan 10 simpul misi + Kantor Raksa di pusat.
// currentRound = indeks ronde (0-9), completed = daftar indeks ronde yang sudah lewat.
```

## API interaksi (`src/interactions/Interaction.tsx`)

```tsx
export interface InteractionProps {
  step: StepDef;
  value: StepAnswer | undefined;
  onChange: (v: StepAnswer) => void;
  disabled?: boolean;
  /** Saat REVEAL: daftar teks jawaban benar dari server (room.reveal.steps[i].correctText). */
  reveal?: string[] | null;
  /** Untuk presentasi 'hotspot'. */
  scene?: SceneKey;
}
export function StepRenderer(props: InteractionProps): JSX.Element;
/** Ringkasan pilihan pemain dalam bentuk teks (untuk halaman hasil/pembahasan). */
export function ringkasJawaban(step: StepDef, value: StepAnswer | undefined): string;
/** true bila langkah sudah terisi cukup untuk dikirim. */
export function langkahTerisi(step: StepDef, value: StepAnswer | undefined): boolean;
```

Bentuk jawaban per jenis langkah (harus tepat, server memvalidasi):

| `step.kind` | bentuk `value` | catatan |
|---|---|---|
| `single` | `string` (id opsi) | satu pilihan |
| `multi`  | `string[]` (id opsi) | `step.requiredSelections` = jumlah yang diharapkan; memilih distraktor mengurangi ketepatan, jadi **beri tahu pemain batas pilihannya** dan cegah memilih lebih dari `requiredSelections` |
| `assign` | `Record<itemId, bucketId>` | pencocokan / klasifikasi / tiga tahap |
| `number` | `number` | `step.suggestions` = chip siap-tap; `step.format === 'rupiah'` -> tampilkan `formatRupiah` |
| `order`  | `string[]` urutan id | (belum dipakai misi mana pun, cukup implementasi sederhana) |

`step.presentation` menentukan tampilan:
- `single`: `cards` (kartu besar) | `list`
- `multi`: `cards` | `hotspot` (ketuk titik pada `<Scene/>`, pakai `option.hotspot.x/y` persen) |
  `folder` (kartu dokumen + area folder) | `checklist`
- `assign`: `match` (kasus -> kesimpulan) | `sort` (bukti -> kategori) | `stage` (tiga tahap bertab)

**Wajib**: semua interaksi bisa diselesaikan dengan **tap** saja. Bila menyediakan
drag-and-drop, tap-to-select + tap-to-place harus tetap tersedia dan nyaman di HP.
Bunyikan `playSfx('pilih')` saat memilih dan `playSfx('bukti')` saat memasukkan bukti/dokumen.

## Halaman yang harus dibuat

Setiap halaman `export default function NamaHalaman()`.

- `src/pages/Landing.tsx` - judul + ilustrasi kota, tombol "Gabung Permainan" (`/join`),
  "Latihan" (`/latihan`), dan akses terpisah host (`/host`) + tautan layar proyektor.
- `src/pages/Join.tsx` - input kode room (dari `?room=` bila ada), nama panggilan (maks 16),
  pemilih karakter, pesan error jelas (room tak ditemukan / pertandingan sudah dimulai ->
  tawarkan jadi penonton via `/projector?room=CODE`).
- `src/pages/Lobby.tsx` - avatar + nama peserta, jumlah peserta, status koneksi & kesiapan,
  instruksi menunggu host, tombol siap, ganti karakter.
- `src/pages/Tutorial.tsx` - latihan mengetuk objek & mengirim jawaban memakai
  `TUTORIAL_MISSION`; tidak memengaruhi skor kompetisi; tampilkan `<Disclaimer/>`.
- `src/pages/Play.tsx` - layar permainan: nomor misi + timer di atas, adegan kasus,
  instruksi singkat, kartu polis mini bila ada, area interaksi, tombol "Kirim Jawaban",
  status "jawaban sudah diterima", ringkasan skor & posisi tanpa membocorkan jawaban;
  fase BRIEFING (input terkunci, cerita + Raki), REVEAL (pembahasan dari `room.reveal`),
  LEADERBOARD, PAUSED.
- `src/pages/Result.tsx` - hasil pribadi: total poin, peringkat, ketepatan, waktu menjawab,
  ringkasan pembelajaran per misi, lencana; podium akhir + confetti singkat.
- `src/pages/Practice.tsx` - mode latihan offline dari `/api/missions` + `POST /api/practice/grade`
  (`{missionId, answer, elapsedSeconds}` -> `{accuracy, score, reveal}`); beri label jelas
  "MODE LATIHAN - tidak masuk leaderboard acara".
- `src/pages/Host.tsx` - buat room + nama acara, QR + kode, daftar peserta, kontrol
  mulai/jeda/lanjut/akhiri, status ronde + jumlah jawaban masuk, saklar auto/manual,
  label hadiah 1-2-3, ekspor CSV, konfirmasi sebelum akhiri/reset, `preferMusicOn()`.
- `src/pages/Projector.tsx` - landscape 16:9 untuk layar kantor: QR + kode room, peta
  perjalanan misi, avatar peserta (kelompokkan bila banyak), progres pengiriman jawaban,
  leaderboard top 10 setelah ronde ditutup, podium akhir, `preferMusicOn()`.

## Ekspor CSV (halaman host)

```
GET /api/room/{code}/results.csv?hostToken={hostToken}
```
Buat tautan unduh biasa (`<a href download>`), jangan fetch manual.

## Endpoint lain

```
GET  /api/config     -> { brand, disclaimer, phaseDurations, joinBaseUrl, lanIp, totalRounds }
GET  /api/missions   -> { missions, tutorial, tiebreak }   (tanpa kunci jawaban)
POST /api/practice/grade
GET  /api/room/{code}/results.json?hostToken=...
```

`room.joinUrl` sudah berisi alamat LAN yang benar untuk QR - **jangan** menyusun URL dari
`window.location` di halaman host/proyektor (bisa jadi localhost yang tidak bisa dibuka HP).

## Gaya visual

Kota mini kartun 2.5D bersudut isometrik, bentuk membulat, bayangan lembut, palet brand.
Kantor Raksa jadi pusat kota. Lokasi lain: parkiran, bengkel, ruko, gudang,
pelabuhan/logistik, proyek alat berat. Teks harus mudah dibaca di HP.
