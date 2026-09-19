/** Server RAKSA GAME: Express + Socket.IO. Sumber kebenaran pertandingan. */

import { createHash, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { Server as SocketServer, type Socket } from 'socket.io';

import { BATAS_KUSTOM, type AcaraTerbuka, type IdPaket, type InfoRoom } from '../../shared/bankSoal';
import { BRAND, DISCLAIMER, PHASE_DURATIONS } from '../../shared/brand';
import { TIEBREAK_MISSION, TUTORIAL_MISSION } from '../../shared/missions';
import { gradeMission, scoreRound } from '../../shared/scoring';
import type { Ack, HostAction, Prizes } from '../../shared/types';
import { assertKeysComplete, buildReveal } from './answerKeys';
import { cariSoal, daftarBank } from './bankKustom';
import { misiLatihan, playlistPaket, soalLatihan } from './bankSoal';
import { CONFIG, detectLanIp, publicBaseUrl } from './config';
import { buildResultsCsv } from './csv';
import {
  BATAS_JUMLAH_SOAL_KUSTOM,
  ambilSoalKustom,
  daftarSoalKustom,
  hapusSoalKustom,
  jumlahSoalKustom,
  listMatches,
  saveMatch,
  simpanSoalKustom,
} from './db';
import {
  GalatGambar,
  MIME_GAMBAR,
  PESAN_JENIS_GAMBAR,
  PESAN_TERLALU_BESAR,
  POLA_NAMA_GAMBAR,
  folderGambar,
  gambarAda,
  hapusGambar,
  simpanGambar,
} from './gambarSoal';
import { POLA_ID_KUSTOM, idKustomBaru, validasiSoalKustom } from './soalKustom';
import { mountUnity } from './unityServe';
import {
  RoomManager,
  sanitizeAnswer,
  sanitizeEventName,
  sanitizeLook,
  sanitizeNickname,
  type Room,
  type RoomEvent,
} from './rooms';

assertKeysComplete();

const app = express();
app.use(cors());
app.use(express.json({ limit: '128kb' }));

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: true, credentials: false },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// ------------------------------------------------------------------ broadcast

const pendingBroadcast = new Set<string>();
let broadcastTimer: NodeJS.Timeout | null = null;

function flushBroadcasts() {
  broadcastTimer = null;
  for (const code of pendingBroadcast) {
    const room = manager.get(code);
    if (!room) continue;
    io.to(code).emit('state', room.publicState());
  }
  pendingBroadcast.clear();
}

/** Kirim snapshot state; digabung (coalesce) 120 ms agar hemat bandwidth. */
function scheduleBroadcast(room: Room) {
  pendingBroadcast.add(room.code);
  if (!broadcastTimer) broadcastTimer = setTimeout(flushBroadcasts, 120);
}

function sendMe(room: Room, playerId: string) {
  const player = room.players.get(playerId);
  if (!player) return;
  io.to(`p:${room.code}:${playerId}`).emit('me', room.privateState(player));
}

function sendMeAll(room: Room) {
  for (const id of room.players.keys()) sendMe(room, id);
}

function onRoomEvent(room: Room, ev: RoomEvent) {
  scheduleBroadcast(room);
  if (ev.type === 'phase' || ev.type === 'finished') {
    // Kirim segera saat fase berubah agar timer client sinkron.
    pendingBroadcast.add(room.code);
    if (broadcastTimer) clearTimeout(broadcastTimer);
    broadcastTimer = setTimeout(flushBroadcasts, 0);
    sendMeAll(room);
  }
  if (ev.type === 'finished' || (ev.type === 'phase' && ev.phase === 'LEADERBOARD')) {
    try {
      saveMatch(room);
    } catch (err) {
      console.error('[db] gagal menyimpan hasil:', (err as Error).message);
    }
  }
}

// Pencari soal lengkap (paket bawaan + soal kustom di SQLite) supaya playlist boleh memuat soal panitia.
const manager = new RoomManager(onRoomEvent, publicBaseUrl, undefined, cariSoal);

setInterval(() => {
  const removed = manager.sweep();
  if (removed.length) console.log('[room] dibersihkan:', removed.join(', '));
}, 30 * 60 * 1000).unref();

// ------------------------------------------------------------------ REST

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, rooms: manager.all().length, now: Date.now() });
});

app.get('/api/config', (_req, res) => {
  res.json({
    brand: BRAND,
    disclaimer: DISCLAIMER,
    phaseDurations: PHASE_DURATIONS,
    joinBaseUrl: publicBaseUrl(),
    lanIp: detectLanIp(),
    // Jumlah ronde room BARU (paket bawaan). Room yang sedang berjalan: RoomPublicState.totalRounds.
    totalRounds: playlistPaket(CONFIG.paketBawaan).length,
    paketBawaan: CONFIG.paketBawaan,
    /** true = membuat room & menulis bank soal butuh PIN panitia. */
    butuhPin: Boolean(CONFIG.panitiaPin),
  });
});

/**
 * Konten publik misi (tanpa kunci jawaban) untuk mode solo/latihan & pratinjau.
 * HANYA paket latihan + tutorial + penentuan: isi soal paket acara & soal kustom tidak bisa
 * diambil dari luar; pemain baru melihatnya saat rondenya dimulai.
 */
app.get('/api/missions', (_req, res) => {
  res.json({ missions: misiLatihan(), tutorial: TUTORIAL_MISSION, tiebreak: TIEBREAK_MISSION });
});

/**
 * Penilaian mode LATIHAN. Terpisah dari kompetisi, tidak masuk leaderboard acara.
 * Kunci jawaban tetap di server; client hanya menerima hasil + pembahasan.
 */
app.post('/api/practice/grade', (req, res) => {
  const { missionId, answer, elapsedSeconds } = (req.body ?? {}) as {
    missionId?: string;
    answer?: unknown;
    elapsedSeconds?: number;
  };
  // Hanya paket latihan + tutorial. Id paket acara / soal kustom -> 404, supaya kuncinya tidak
  // bisa dipancing dari luar. Ronde penentuan hanya di luar production (alat uji).
  const entri = soalLatihan(missionId, { penentuan: process.env.NODE_ENV !== 'production' });
  if (!entri) {
    res.status(404).json({ ok: false, error: 'Misi tidak ditemukan' });
    return;
  }
  const { misi: mission, kunci: key } = entri;
  const clean = sanitizeAnswer(mission, answer);
  const grade = gradeMission(key, clean);
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, Number(elapsedSeconds)) : mission.durationSeconds;
  const score = scoreRound(grade.accuracy, elapsed, mission.durationSeconds);
  res.json({
    ok: true,
    mode: 'latihan',
    accuracy: grade.accuracy,
    steps: grade.steps,
    score,
    reveal: buildReveal(mission, key),
  });
});

function requireHost(req: express.Request): Room | null {
  const room = manager.get(String(req.params.code ?? ''));
  const token = String(req.query.hostToken ?? req.header('x-host-token') ?? '');
  if (!room || token !== room.hostToken) return null;
  return room;
}

app.get('/api/room/:code/results.csv', (req, res) => {
  const room = requireHost(req);
  if (!room) {
    res.status(403).type('text/plain').send('Token host tidak valid');
    return;
  }
  const filename = `raksa-game-${room.code}-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buildResultsCsv(room));
});

app.get('/api/room/:code/results.json', (req, res) => {
  const room = requireHost(req);
  if (!room) {
    res.status(403).json({ ok: false, error: 'Token host tidak valid' });
    return;
  }
  res.json({
    ok: true,
    code: room.code,
    eventName: room.settings.eventName,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    prizes: room.settings.prizes,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      nickname: p.nickname,
      totalPoints: p.totalPoints,
      totalAccuracy: p.totalAccuracy,
      totalTimeMs: p.totalTimeMs,
      rounds: p.rounds,
    })),
    leaderboard: room.podium ?? room.leaderboard,
  });
});

app.get('/api/matches', (_req, res) => {
  try {
    res.json({ ok: true, matches: listMatches() });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ------------------------------------------------------------------ validasi kode room

// Teks alasan SAMA PERSIS dengan balasan player:join supaya client menerjemahkannya lewat kamus yang sama.
const GALAT_GABUNG = {
  sudahMulai: 'Pertandingan sudah dimulai. Kamu bisa masuk sebagai penonton.',
  penuh: 'Room sudah penuh.',
} as const;

function alasanTidakBisaGabung(room: Room): string | undefined {
  if (room.matchStarted) return GALAT_GABUNG.sudahMulai;
  if (room.players.size >= CONFIG.maxPlayersPerRoom) return GALAT_GABUNG.penuh;
  return undefined;
}

/** Cek kode room SEBELUM pemain mengisi nama & karakter. Tanpa data pemain, tanpa isi soal. */
app.get('/api/room/:code/info', (req, res) => {
  const room = manager.get(String(req.params.code ?? ''));
  if (!room) {
    res.status(404).json({ ok: false, error: 'Kode tidak ditemukan' });
    return;
  }
  const alasan = alasanTidakBisaGabung(room);
  const info: InfoRoom = {
    ok: true,
    code: room.code,
    eventName: room.settings.eventName,
    phase: room.phase,
    playerCount: room.players.size,
    bisaGabung: alasan === undefined,
    ...(alasan ? { alasan } : {}),
  };
  res.json(info);
});

/** Spanduk halaman awal: terisi hanya bila TEPAT satu room sedang di lobby (dan iklan tidak dimatikan). */
app.get('/api/acara-terbuka', (_req, res) => {
  const lobby = CONFIG.iklanRoom ? manager.all().filter((r) => r.phase === 'LOBBY') : [];
  const satu = lobby.length === 1 ? lobby[0] : undefined;
  const hasil: AcaraTerbuka = {
    ok: true,
    acara: satu ? { code: satu.code, eventName: satu.settings.eventName, playerCount: satu.players.size } : null,
  };
  res.json(hasil);
});

// ------------------------------------------------------------------ PIN panitia

const GALAT_PIN = {
  salah: 'PIN panitia salah',
  terkunci: 'Terlalu banyak percobaan PIN. Coba lagi beberapa menit lagi.',
} as const;
const PIN_MAKS_GAGAL = 8;
const PIN_JENDELA_MS = 5 * 60 * 1000;
/** asal (alamat IP) -> jumlah PIN salah dalam jendela waktu. Rem untuk tebak-tebakan PIN. */
const gagalPin = new Map<string, { n: number; sampai: number }>();

/** Banding teks tanpa membocorkan posisi beda lewat waktu. */
function samaAman(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function cekPin(pin: unknown, asal: string): 'ok' | 'salah' | 'terkunci' {
  if (!CONFIG.panitiaPin) return 'ok';
  const kini = Date.now();
  if (gagalPin.size > 2000) for (const [k, v] of gagalPin) if (v.sampai <= kini) gagalPin.delete(k);
  let catatan = gagalPin.get(asal);
  if (catatan && catatan.sampai <= kini) {
    gagalPin.delete(asal);
    catatan = undefined;
  }
  if (catatan && catatan.n >= PIN_MAKS_GAGAL) return 'terkunci';
  if (typeof pin === 'string' && samaAman(pin, CONFIG.panitiaPin)) return 'ok';
  gagalPin.set(asal, { n: (catatan?.n ?? 0) + 1, sampai: catatan?.sampai ?? kini + PIN_JENDELA_MS });
  return 'salah';
}

/** Untuk tes. */
function resetPembatasPin(): void {
  gagalPin.clear();
}

// ------------------------------------------------------------------ bank soal

/**
 * Izin API bank yang MENULIS atau MEMBUKA KUNCI: host room hidup mana pun (x-room-code +
 * x-host-token) DAN PIN panitia bila dipasang (x-panitia-pin). Tanpa PANITIA_PIN, siapa pun
 * yang bisa membuat room bisa menulis bank - sama terbukanya dengan halaman host.
 */
function izinBank(req: express.Request, res: express.Response): boolean {
  const room = manager.get(String(req.header('x-room-code') ?? ''));
  const token = String(req.header('x-host-token') ?? '');
  if (!room || !token || !samaAman(token, room.hostToken)) {
    res.status(403).json({ ok: false, error: 'Token host tidak valid' });
    return false;
  }
  const pin = cekPin(req.header('x-panitia-pin'), String(req.ip ?? 'rest'));
  if (pin !== 'ok') {
    res.status(pin === 'terkunci' ? 429 : 403).json({ ok: false, error: GALAT_PIN[pin] });
    return false;
  }
  return true;
}

const wajibIzinBank: express.RequestHandler = (req, res, next) => {
  if (izinBank(req, res)) next();
};

/** Ringkasan semua soal (tanpa isi pertanyaan & tanpa kunci) untuk penyusun playlist. */
app.get('/api/bank', (_req, res) => {
  res.json(daftarBank());
});

/** Isi lengkap satu soal KUSTOM untuk editor. MEMUAT KUNCI -> wajib izin. Paket bawaan tidak pernah lewat sini. */
app.get('/api/bank/soal/:id', wajibIzinBank, (req, res) => {
  const id = String(req.params.id ?? '');
  const soal = POLA_ID_KUSTOM.test(id) ? ambilSoalKustom(id) : undefined;
  if (!soal) {
    res.status(404).json({ ok: false, error: 'Soal tidak ditemukan' });
    return;
  }
  res.json({ ok: true, soal });
});

app.post('/api/bank/soal', wajibIzinBank, (req, res) => {
  if (jumlahSoalKustom() >= BATAS_JUMLAH_SOAL_KUSTOM) {
    res.status(400).json({
      ok: false,
      error: 'Bank soal penuh',
      rincian: [`Soal kustom maksimal ${BATAS_JUMLAH_SOAL_KUSTOM}. Hapus soal yang tidak dipakai.`],
    });
    return;
  }
  let id = idKustomBaru();
  while (ambilSoalKustom(id)) id = idKustomBaru();
  const hasil = validasiSoalKustom(req.body, { id, gambarAda });
  if (!hasil.ok) {
    res.status(400).json({ ok: false, error: 'Soal belum lengkap', rincian: hasil.rincian });
    return;
  }
  res.json({ ok: true, soal: simpanSoalKustom(hasil.soal) });
});

app.put('/api/bank/soal/:id', wajibIzinBank, (req, res) => {
  const id = String(req.params.id ?? '');
  if (!POLA_ID_KUSTOM.test(id) || !ambilSoalKustom(id)) {
    res.status(404).json({ ok: false, error: 'Soal tidak ditemukan' });
    return;
  }
  const hasil = validasiSoalKustom(req.body, { id, gambarAda });
  if (!hasil.ok) {
    res.status(400).json({ ok: false, error: 'Soal belum lengkap', rincian: hasil.rincian });
    return;
  }
  // Room yang sedang bertanding memakai salinan beku soal ini; suntingan berlaku di pertandingan berikutnya.
  res.json({ ok: true, soal: simpanSoalKustom(hasil.soal) });
});

app.delete('/api/bank/soal/:id', wajibIzinBank, (req, res) => {
  const id = String(req.params.id ?? '');
  const soal = POLA_ID_KUSTOM.test(id) ? ambilSoalKustom(id) : undefined;
  if (!soal) {
    res.status(404).json({ ok: false, error: 'Soal tidak ditemukan' });
    return;
  }
  const dipakai = manager.all().some((r) => r.phase !== 'LOBBY' && r.phase !== 'FINISHED' && r.playlist.includes(id));
  if (dipakai) {
    res.status(409).json({ ok: false, error: 'Soal sedang dipakai pertandingan yang berjalan' });
    return;
  }
  hapusSoalKustom(id);
  // Room yang masih di lobby: keluarkan soal ini dari playlist-nya (state disiarkan lewat touch()).
  for (const r of manager.all()) r.buangDariPlaylist(id, playlistPaket(CONFIG.paketBawaan));
  // Gambar bernama hash isi bisa dipakai beberapa soal: hapus hanya bila sudah yatim.
  const src = soal.image?.src;
  if (src && !daftarSoalKustom().some((s) => s.image?.src === src)) hapusGambar(src);
  res.json({ ok: true });
});

/**
 * Unggah gambar soal. Badan = byte gambar. Izin diperiksa SEBELUM badan dibaca; jenis berkas
 * ditentukan dari magic bytes (bukan nama / Content-Type kiriman), jadi SVG selalu ditolak.
 */
app.post(
  '/api/bank/gambar',
  wajibIzinBank,
  (req, res, next) => {
    const jenis = String(req.header('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!(MIME_GAMBAR as readonly string[]).includes(jenis)) {
      res.status(415).json({ ok: false, error: PESAN_JENIS_GAMBAR });
      return;
    }
    next();
  },
  express.raw({ type: () => true, limit: BATAS_KUSTOM.gambarMaks }),
  (req, res) => {
    try {
      res.json({ ok: true, src: simpanGambar(req.body as Buffer) });
    } catch (err) {
      if (!(err instanceof GalatGambar)) throw err;
      res.status(err.status).json({ ok: false, error: err.message });
    }
  },
);

/**
 * Berkas gambar soal. Hanya nama berpola hash (tanpa pemisah folder) yang dilayani, jadi
 * path traversal tidak mungkin. WAJIB dipasang sebelum fallback SPA.
 */
app.get('/gambar-soal/:nama', (req, res) => {
  const nama = String(req.params.nama ?? '');
  const tiada = () => {
    if (!res.headersSent) res.status(404).type('text/plain').send('Gambar tidak ditemukan');
  };
  if (!POLA_NAMA_GAMBAR.test(nama)) return tiada();
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(nama, { root: folderGambar(), maxAge: 24 * 60 * 60 * 1000, dotfiles: 'deny' }, (err) => {
    if (err) tiada();
  });
});
app.use('/gambar-soal', (_req, res) => {
  res.status(404).type('text/plain').send('Gambar tidak ditemukan');
});

// Build Unity disajikan di /unity/* dengan MIME & Content-Encoding yang benar.
// WAJIB dipasang sebelum fallback SPA supaya file Unity yang hilang jadi 404,
// bukan halaman HTML.
mountUnity(app);

// ------------------------------------------------------------------ Socket.IO

interface SocketData {
  code?: string;
  role?: 'host' | 'player' | 'spectator';
  playerId?: string;
}

const ok = <T>(data?: T): Ack<T> => ({ ok: true, data });
const fail = (error: string): Ack<never> => ({ ok: false, error });

type AckFn = (res: Ack<unknown>) => void;
const reply = (cb: unknown, res: Ack<unknown>) => {
  if (typeof cb === 'function') (cb as AckFn)(res);
};

io.on('connection', (socket: Socket) => {
  const data = socket.data as SocketData;

  // Satu paket cacat (mis. { code: { toString: 1 } }) tidak boleh menjatuhkan
  // server dan menghapus semua room: setiap handler dijaga, pengirim dapat ack gagal.
  const pasang = socket.on.bind(socket);
  socket.on = ((ev: string, fn: (...args: unknown[]) => unknown) =>
    pasang(ev, (...args: unknown[]) => {
      const gagal = (err: unknown): void => {
        console.warn(`[socket] ${ev} ditolak: ${(err as Error)?.message ?? String(err)}`);
        reply(args[args.length - 1], { ok: false, error: 'Permintaan tidak dapat diproses.' });
      };
      try {
        const hasil = fn(...args);
        if (hasil && typeof (hasil as Promise<unknown>).catch === 'function') (hasil as Promise<unknown>).catch(gagal);
      } catch (err) {
        gagal(err);
      }
    })) as typeof socket.on;

  socket.on('host:create', (payload: { eventName?: string; paket?: string; pin?: string }, cb) => {
    const pin = cekPin(payload?.pin, String(socket.handshake.address ?? 'ws'));
    if (pin !== 'ok') return reply(cb, fail(GALAT_PIN[pin]));
    const paket: IdPaket =
      payload?.paket === 'latihan' || payload?.paket === 'acara' ? payload.paket : CONFIG.paketBawaan;
    const room = manager.create(sanitizeEventName(payload?.eventName) || undefined, playlistPaket(paket));
    data.code = room.code;
    data.role = 'host';
    socket.join(room.code);
    console.log(`[room] dibuat ${room.code} - ${room.settings.eventName} (${room.totalRounds} soal)`);
    reply(
      cb,
      ok({ code: room.code, hostToken: room.hostToken, state: room.publicState(), playlist: [...room.playlist] }),
    );
  });

  socket.on('host:attach', (payload: { code?: string; hostToken?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    if (payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
    data.code = room.code;
    data.role = 'host';
    socket.join(room.code);
    // Playlist hanya untuk host (tidak ada di publicState: judul soal berikutnya tidak boleh bocor).
    reply(cb, ok({ code: room.code, state: room.publicState(), playlist: [...room.playlist] }));
  });

  /** Baca (tanpa `playlist`) atau ganti playlist room. Mengganti hanya saat LOBBY. */
  socket.on('host:playlist', (payload: { code?: string; hostToken?: string; playlist?: unknown }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room || payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
    if (payload.playlist === undefined || payload.playlist === null) {
      return reply(cb, ok({ playlist: [...room.playlist] }));
    }
    try {
      // setPlaylist menyiarkan state baru (totalRounds) lewat event room.
      reply(cb, ok({ playlist: room.setPlaylist(payload.playlist) }));
    } catch (err) {
      reply(cb, fail((err as Error).message));
    }
  });

  socket.on(
    'host:settings',
    (
      payload: { code?: string; hostToken?: string; eventName?: string; autoAdvance?: boolean; prizes?: Partial<Prizes> },
      cb,
    ) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room || payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
      const newName = sanitizeEventName(payload?.eventName);
      if (newName) room.settings.eventName = newName;
      if (typeof payload.autoAdvance === 'boolean') room.settings.autoAdvance = payload.autoAdvance;
      if (payload.prizes) {
        for (const k of ['first', 'second', 'third'] as const) {
          const v = payload.prizes[k];
          if (typeof v === 'string') room.settings.prizes[k] = v.slice(0, 60);
        }
      }
      scheduleBroadcast(room);
      reply(cb, ok({ state: room.publicState() }));
    },
  );

  socket.on(
    'host:action',
    (payload: { code?: string; hostToken?: string; action?: HostAction; playerId?: string }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      // Validasi izin host pada SETIAP tindakan.
      if (!room || payload?.hostToken !== room.hostToken) return reply(cb, fail('Token host tidak valid'));
      try {
        switch (payload.action) {
          case 'startTutorial':
            room.startTutorial();
            break;
          case 'startMatch':
            room.startMatch();
            break;
          case 'pause':
            room.pause();
            break;
          case 'resume':
            room.resume();
            break;
          case 'next':
            room.next();
            break;
          case 'closeRound':
            room.closeRound();
            break;
          case 'end':
            room.finish();
            break;
          case 'reset':
            room.reset();
            break;
          case 'tiebreak':
            room.startTiebreak();
            break;
          case 'retryScene': {
            const pid = String(payload.playerId ?? '');
            if (!room.clearSceneReady(pid)) return reply(cb, fail('Peserta tidak ditemukan'));
            io.to(`p:${room.code}:${pid}`).emit('scene:retry', { roundIndex: room.roundIndex });
            break;
          }
          case 'kick': {
            const pid = String(payload.playerId ?? '');
            io.to(`p:${room.code}:${pid}`).emit('kicked');
            room.removePlayer(pid);
            break;
          }
          default:
            return reply(cb, fail('Tindakan tidak dikenal'));
        }
      } catch (err) {
        return reply(cb, fail((err as Error).message));
      }
      reply(cb, ok({ state: room.publicState() }));
    },
  );

  socket.on('player:join', (payload: { code?: string; nickname?: string; look?: unknown }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan. Periksa kembali kodenya.'));
    const alasan = alasanTidakBisaGabung(room);
    if (alasan) return reply(cb, fail(alasan));
    const nickname = sanitizeNickname(payload?.nickname);
    if (nickname.length < 2) return reply(cb, fail('Nama panggilan minimal 2 karakter.'));

    const player = room.addPlayer(nickname, sanitizeLook(payload?.look));
    data.code = room.code;
    data.role = 'player';
    data.playerId = player.id;
    socket.join(room.code);
    socket.join(`p:${room.code}:${player.id}`);
    sendMe(room, player.id);
    reply(
      cb,
      ok({
        playerId: player.id,
        playerToken: player.token,
        code: room.code,
        state: room.publicState(),
        me: room.privateState(player),
      }),
    );
  });

  socket.on('player:rejoin', (payload: { code?: string; playerToken?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal di room ini'));
    room.setConnected(player.id, true);
    data.code = room.code;
    data.role = 'player';
    data.playerId = player.id;
    socket.join(room.code);
    socket.join(`p:${room.code}:${player.id}`);
    sendMe(room, player.id);
    reply(
      cb,
      ok({
        playerId: player.id,
        playerToken: player.token,
        code: room.code,
        state: room.publicState(),
        me: room.privateState(player),
      }),
    );
  });

  socket.on('player:look', (payload: { code?: string; playerToken?: string; nickname?: string; look?: unknown }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
    if (room.matchStarted) return reply(cb, fail('Pertandingan sudah dimulai'));
    const nick = sanitizeNickname(payload?.nickname);
    if (nick.length >= 2) player.nickname = nick;
    if (payload?.look) player.look = sanitizeLook(payload.look);
    scheduleBroadcast(room);
    sendMe(room, player.id);
    reply(cb, ok({ me: room.privateState(player) }));
  });

  socket.on('player:ready', (payload: { code?: string; playerToken?: string; ready?: boolean }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    const player = room.playerByToken(String(payload?.playerToken ?? ''));
    if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
    player.ready = Boolean(payload?.ready);
    scheduleBroadcast(room);
    reply(cb, ok({}));
  });

  socket.on(
    'player:submit',
    (payload: { code?: string; playerToken?: string; roundIndex?: number; answer?: unknown }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room) return reply(cb, fail('Room tidak ditemukan'));
      const player = room.playerByToken(String(payload?.playerToken ?? ''));
      if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
      const roundIndex = Number(payload?.roundIndex);
      if (!Number.isInteger(roundIndex)) return reply(cb, fail('Nomor ronde tidak valid'));

      const result = room.submit(player, roundIndex, payload?.answer);
      if (!result.accepted) return reply(cb, fail(result.reason ?? 'Jawaban tidak diterima'));
      sendMe(room, player.id);
      // Acknowledgement: client menandai jawaban sudah diterima server.
      reply(
        cb,
        ok({
          accepted: true,
          duplicate: result.reason === 'sudah-terkirim',
          roundIndex,
          elapsedMs: result.elapsedMs ?? 0,
        }),
      );
    },
  );

  /**
   * Client melaporkan adegan 3D ronde ini sudah siap.
   * Hanya informasi untuk host: TIDAK menambah waktu menjawab siapa pun.
   */
  socket.on(
    'player:sceneReady',
    (payload: { code?: string; playerToken?: string; roundIndex?: number }, cb) => {
      const room = manager.get(String(payload?.code ?? ''));
      if (!room) return reply(cb, fail('Room tidak ditemukan'));
      const player = room.playerByToken(String(payload?.playerToken ?? ''));
      if (!player) return reply(cb, fail('Identitas pemain tidak dikenal'));
      const ok2 = room.markSceneReady(player, Number(payload?.roundIndex));
      reply(cb, ok({ accepted: ok2, roundIndex: room.roundIndex }));
    },
  );

  socket.on('spectator:join', (payload: { code?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    data.code = room.code;
    data.role = 'spectator';
    room.spectators.add(socket.id);
    socket.join(room.code);
    scheduleBroadcast(room);
    reply(cb, ok({ code: room.code, state: room.publicState() }));
  });

  socket.on('state:request', (payload: { code?: string }, cb) => {
    const room = manager.get(String(payload?.code ?? ''));
    if (!room) return reply(cb, fail('Room tidak ditemukan'));
    if (data.playerId) {
      const p = room.players.get(data.playerId);
      if (p) sendMe(room, p.id);
    }
    reply(cb, ok({ state: room.publicState() }));
  });

  socket.on('disconnect', () => {
    if (!data.code) return;
    const room = manager.get(data.code);
    if (!room) return;
    room.spectators.delete(socket.id);
    if (data.role === 'player' && data.playerId) {
      // Pemain mungkin hanya refresh; tandai disconnected tapi skor tetap.
      const stillHere = io.sockets.adapter.rooms.get(`p:${room.code}:${data.playerId}`);
      if (!stillHere || stillHere.size === 0) room.setConnected(data.playerId, false);
    }
    scheduleBroadcast(room);
  });
});

// ------------------------------------------------------------------ static

if (fs.existsSync(CONFIG.clientDist)) {
  app.use(
    express.static(CONFIG.clientDist, {
      // Berkas di /assets bernama hash (Vite): aman di-cache lama, jadi engine
      // adegan tidak diunduh ulang oleh HP peserta setiap ronde/refresh.
      setHeaders: (res, filePath) => {
        if (/[\\/]assets[\\/]/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        // Sprite tokoh: nama berkas tetap, jadi cukup di-cache 1 jam (tidak divalidasi ulang tiap halaman).
        else if (/[\\/]karakter[\\/]/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    }),
  );
  app.get(/^(?!\/api\/|\/socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(CONFIG.clientDist, 'index.html'));
  });
  console.log('[static] menyajikan', CONFIG.clientDist);
} else {
  app.get('/', (_req, res) => {
    res
      .type('text/plain')
      .send(
        'Server RAKSA GAME aktif.\nMode development: buka client Vite di port ' +
          CONFIG.clientDevPort +
          '.\nUntuk produksi jalankan: npm run build lalu npm start.',
      );
  });
}

// Galat REST -> JSON berbahasa Indonesia (bukan halaman HTML + jejak tumpukan bawaan Express):
// badan permintaan cacat / melewati batas, dan galat tak terduga di rute /api (mis. SQLite).
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  const jenis = (err as { type?: string } | null)?.type;
  if (jenis === 'entity.too.large') {
    const unggahGambar = req.path === '/api/bank/gambar';
    res.status(413).json({ ok: false, error: unggahGambar ? PESAN_TERLALU_BESAR : 'Data terlalu besar' });
    return;
  }
  if (jenis === 'entity.parse.failed') {
    res.status(400).json({ ok: false, error: 'Data tidak dapat dibaca' });
    return;
  }
  if (req.path.startsWith('/api/')) {
    console.error(`[api] ${req.method} ${req.path}:`, (err as Error)?.message ?? err);
    res.status(500).json({ ok: false, error: 'Terjadi galat di server' });
    return;
  }
  next(err);
});

server.listen(CONFIG.port, CONFIG.host, () => {
  const base = publicBaseUrl();
  console.log('');
  console.log(`  ${BRAND.gameName} - server aktif`);
  console.log(`  Lokal    : http://localhost:${CONFIG.port}`);
  console.log(`  Jaringan : ${base}`);
  console.log(`  Host     : ${base}/host`);
  console.log(`  Proyektor: ${base}/projector`);
  console.log('');
});

export { app, server, io, manager, resetPembatasPin };
