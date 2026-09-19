/**
 * Bank soal lewat jalur sungguhan (REST + Socket.IO + SQLite sementara):
 * validasi kode room, iklan room, izin & PIN, CRUD soal kustom, unggah gambar,
 * playlist kustom sampai FINISHED, dan pagar /api/practice/grade.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';

const PORT = 43921;
// Folder sendiri: gambar soal disimpan di sebelah berkas DB.
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'raksa-bank-test-'));
process.env.PORT = String(PORT);
process.env.HOST = '127.0.0.1';
process.env.DB_FILE = path.join(DIR, 'bank.db');
process.env.PUBLIC_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.NODE_ENV = 'test';
process.env.RAKSA_PAKET = 'latihan';
process.env.RAKSA_IKLAN_ROOM = 'on';
// String kosong (bukan delete) supaya PANITIA_PIN di .env tidak ikut terbaca oleh config.ts.
process.env.PANITIA_PIN = '';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const srv = require('./index') as typeof import('./index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CONFIG } = require('./config') as typeof import('./config');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { closeDb } = require('./db') as typeof import('./db');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { io: ioClient } = require('socket.io-client') as typeof import('socket.io-client');
import type { Socket as ClientSocket } from 'socket.io-client';
import type { AcaraTerbuka, BankSoal, InfoRoom, SoalKustom } from '../../shared/bankSoal';
import { MISSIONS, TIEBREAK_MISSION } from '../../shared/missions';
import { MISSIONS_ACARA } from '../../shared/missions.acara';
import type { Ack, MePrivate, RoomPublicState } from '../../shared/types';

const BASE = `http://127.0.0.1:${PORT}`;
const soket: ClientSocket[] = [];

after(() => {
  for (const s of soket) s.disconnect();
  srv.io.close();
  srv.server.close();
  closeDb();
  try {
    fs.rmSync(DIR, { recursive: true, force: true });
  } catch {
    /* abaikan */
  }
});

// ------------------------------------------------------------------ alat bantu

async function connect(): Promise<ClientSocket> {
  const sock = ioClient(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
  soket.push(sock);
  await new Promise<void>((resolve, reject) => {
    sock.once('connect', () => resolve());
    sock.once('connect_error', reject);
  });
  return sock;
}

function rpc<T = unknown>(sock: ClientSocket, event: string, payload: unknown): Promise<Ack<T>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${event}`)), 8000);
    sock.emit(event, payload, (res: Ack<T>) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function waitState(sock: ClientSocket, pred: (s: RoomPublicState) => boolean, label: string): Promise<RoomPublicState> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      sock.off('state', on);
      reject(new Error(`timeout menunggu ${label}`));
    }, 8000);
    const on = (s: RoomPublicState) => {
      if (!pred(s)) return;
      clearTimeout(t);
      sock.off('state', on);
      resolve(s);
    };
    sock.on('state', on);
  });
}

interface Hasil<T> {
  status: number;
  badan: T;
  kepala: Headers;
}

async function api<T = Record<string, unknown>>(
  metode: string,
  alamat: string,
  opsi: { kepala?: Record<string, string>; json?: unknown; byte?: Uint8Array; jenis?: string } = {},
): Promise<Hasil<T>> {
  const kepala: Record<string, string> = { ...(opsi.kepala ?? {}) };
  let body: string | Uint8Array | undefined;
  if (opsi.json !== undefined) {
    kepala['content-type'] = 'application/json';
    body = JSON.stringify(opsi.json);
  } else if (opsi.byte) {
    kepala['content-type'] = opsi.jenis ?? 'image/png';
    body = opsi.byte;
  }
  const res = await fetch(BASE + alamat, { method: metode, headers: kepala, body });
  const teks = await res.text();
  let badan: unknown = teks;
  try {
    badan = JSON.parse(teks);
  } catch {
    /* bukan JSON */
  }
  return { status: res.status, badan: badan as T, kepala: res.headers };
}

interface RoomHost {
  sock: ClientSocket;
  code: string;
  hostToken: string;
  izin: Record<string, string>;
}

async function buatRoom(eventName: string, tambahan: Record<string, unknown> = {}): Promise<RoomHost> {
  const sock = await connect();
  const res = await rpc<{ code: string; hostToken: string; playlist: string[] }>(sock, 'host:create', {
    eventName,
    ...tambahan,
  });
  assert.equal(res.ok, true, res.error);
  const { code, hostToken } = res.data!;
  return { sock, code, hostToken, izin: { 'x-room-code': code, 'x-host-token': hostToken } };
}

/** PNG 1x1 sungguhan. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

function kiriman(ubah: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Foto mana yang dipakai?',
    product: 'AUTO',
    tingkat: 2,
    story: 'Nasabah mengirim beberapa foto setelah mobilnya tersenggol di parkiran.',
    instruction: 'Pilih foto yang paling membantu pemeriksaan.',
    learning: 'Foto titik kerusakan dan identitas kendaraan paling membantu pemeriksaan.',
    durationSeconds: 30,
    image: null,
    steps: [
      {
        kind: 'single',
        prompt: 'Foto mana yang paling membantu?',
        options: [{ label: 'Foto penyok pintu kiri' }, { label: 'Foto makan siang' }, { label: 'Foto langit sore' }],
        benar: ['o1'],
        penjelasan: 'PENJELASAN-RAHASIA: foto penyok menunjukkan titik kerusakan.',
      },
    ],
    ...ubah,
  };
}

// ------------------------------------------------------------------ tes

test('config, info room, dan iklan room di lobby', async () => {
  const cfg = await api<{ butuhPin: boolean; paketBawaan: string; totalRounds: number }>('GET', '/api/config');
  assert.equal(cfg.badan.butuhPin, false);
  assert.equal(cfg.badan.paketBawaan, 'latihan');
  assert.equal(cfg.badan.totalRounds, MISSIONS.length);

  const kosong = await api<AcaraTerbuka>('GET', '/api/acara-terbuka');
  assert.deepEqual(kosong.badan, { ok: true, acara: null }, 'belum ada room');

  const salah = await api('GET', '/api/room/ZZZZ/info');
  assert.equal(salah.status, 404);
  assert.deepEqual(salah.badan, { ok: false, error: 'Kode tidak ditemukan' });

  const a = await buatRoom('Gathering Info');
  const info = await api<InfoRoom>('GET', `/api/room/${a.code.toLowerCase()}/info`);
  assert.equal(info.status, 200);
  assert.deepEqual(info.badan, {
    ok: true,
    code: a.code,
    eventName: 'Gathering Info',
    phase: 'LOBBY',
    playerCount: 0,
    bisaGabung: true,
  });
  assert.equal(JSON.stringify(info.badan).includes(a.hostToken), false);

  const satu = await api<AcaraTerbuka>('GET', '/api/acara-terbuka');
  assert.deepEqual(satu.badan.acara, { code: a.code, eventName: 'Gathering Info', playerCount: 0 });

  CONFIG.iklanRoom = false;
  assert.equal((await api<AcaraTerbuka>('GET', '/api/acara-terbuka')).badan.acara, null, 'RAKSA_IKLAN_ROOM=off');
  CONFIG.iklanRoom = true;

  const b = await buatRoom('Room Kedua');
  assert.equal((await api<AcaraTerbuka>('GET', '/api/acara-terbuka')).badan.acara, null, 'dua room di lobby = tidak diiklankan');

  // Room yang sudah mulai: tidak diiklankan, dan alasan = teks galat player:join yang sama persis.
  const pemain = await connect();
  assert.equal((await rpc(pemain, 'player:join', { code: b.code, nickname: 'Ani' })).ok, true);
  assert.equal((await api<InfoRoom>('GET', `/api/room/${b.code}/info`)).badan.playerCount, 1);
  await rpc(b.sock, 'host:action', { code: b.code, hostToken: b.hostToken, action: 'startMatch' });
  const mulai = await api<InfoRoom>('GET', `/api/room/${b.code}/info`);
  assert.equal(mulai.badan.bisaGabung, false);
  assert.equal(mulai.badan.phase, 'BRIEFING');
  const telat = await rpc(await connect(), 'player:join', { code: b.code, nickname: 'Telat' });
  assert.equal(telat.ok, false);
  assert.match(telat.error!, /sudah dimulai/);
  assert.equal(mulai.badan.alasan, telat.error);
  assert.equal((await api<AcaraTerbuka>('GET', '/api/acara-terbuka')).badan.acara?.code, a.code);

  srv.manager.close(a.code);
  srv.manager.close(b.code);
});

test('bank: izin, validasi, CRUD soal kustom, kunci tidak bocor', async () => {
  const h = await buatRoom('Bank');

  const awal = await api<BankSoal>('GET', '/api/bank');
  assert.equal(awal.status, 200);
  assert.deepEqual(awal.badan.paket.latihan, MISSIONS.map((m) => m.id));
  assert.deepEqual(awal.badan.paket.acara, MISSIONS_ACARA.map((m) => m.id));
  assert.equal(awal.badan.bawaan, 'latihan');
  assert.equal(awal.badan.soal.filter((s) => s.asal === 'latihan').length, MISSIONS.length);
  assert.deepEqual(
    awal.badan.soal.filter((s) => s.asal === 'latihan').map((s) => s.tingkat),
    MISSIONS.map((m, i) => m.level ?? (i <= 2 ? 1 : i <= 6 ? 2 : 3)),
  );
  assert.equal(awal.badan.soal.some((s) => s.id === TIEBREAK_MISSION.id), false);
  assert.equal(JSON.stringify(awal.badan).includes('explanation'), false);

  // Tanpa izin / token salah / room tak dikenal: semua jalur tulis & buka-kunci ditolak.
  const tanpaIzin: Record<string, string>[] = [
    {},
    { 'x-room-code': h.code },
    { 'x-host-token': h.hostToken },
    { 'x-room-code': h.code, 'x-host-token': 'palsu' },
    { 'x-room-code': 'ZZZZ', 'x-host-token': h.hostToken },
  ];
  for (const kepala of tanpaIzin) {
    assert.equal((await api('POST', '/api/bank/soal', { kepala, json: kiriman() })).status, 403);
    assert.equal((await api('PUT', '/api/bank/soal/k-aaaaaaaa', { kepala, json: kiriman() })).status, 403);
    assert.equal((await api('DELETE', '/api/bank/soal/k-aaaaaaaa', { kepala })).status, 403);
    assert.equal((await api('GET', '/api/bank/soal/k-aaaaaaaa', { kepala })).status, 403);
    assert.equal((await api('POST', '/api/bank/gambar', { kepala, byte: PNG })).status, 403);
  }

  const buruk = await api<{ ok: boolean; error: string; rincian: string[] }>('POST', '/api/bank/soal', {
    kepala: h.izin,
    json: kiriman({ title: '', durationSeconds: 5 }),
  });
  assert.equal(buruk.status, 400);
  assert.equal(buruk.badan.ok, false);
  assert.deepEqual(buruk.badan.rincian, ['Judul wajib diisi.', 'Durasi harus antara 20 dan 180 detik.']);
  const cacat = await fetch(`${BASE}/api/bank/soal`, {
    method: 'POST',
    headers: { ...h.izin, 'content-type': 'application/json' },
    body: '{bukan json',
  });
  assert.equal(cacat.status, 400);
  assert.deepEqual(await cacat.json(), { ok: false, error: 'Data tidak dapat dibaca' });

  const dibuat = await api<{ ok: boolean; soal: SoalKustom }>('POST', '/api/bank/soal', { kepala: h.izin, json: kiriman() });
  assert.equal(dibuat.status, 200);
  const id = dibuat.badan.soal.id;
  assert.match(id, /^k-[a-z0-9]{8}$/);
  assert.equal(dibuat.badan.soal.steps[0].id, 's1');
  assert.deepEqual(dibuat.badan.soal.steps[0].benar, ['o1']);
  assert.ok(dibuat.badan.soal.diubah);

  // Ringkasan publik memuat soal baru TANPA isi & kunci.
  const bank = await api<BankSoal>('GET', '/api/bank');
  assert.deepEqual(bank.badan.soal.find((s) => s.id === id), {
    id,
    judul: 'Foto mana yang dipakai?',
    produk: 'AUTO',
    tingkat: 2,
    asal: 'kustom',
    langkah: 1,
    durasi: 30,
    gambar: null,
  });
  const mentah = JSON.stringify(bank.badan);
  for (const bocor of ['PENJELASAN-RAHASIA', 'benar', 'Foto makan siang', 'penjelasan']) {
    assert.equal(mentah.includes(bocor), false, bocor);
  }

  // Isi lengkap (dengan kunci) hanya untuk host, dan hanya soal kustom.
  const penuh = await api<{ ok: boolean; soal: SoalKustom }>('GET', `/api/bank/soal/${id}`, { kepala: h.izin });
  assert.equal(penuh.status, 200);
  assert.deepEqual(penuh.badan.soal.steps[0].benar, ['o1']);
  assert.equal((await api('GET', '/api/bank/soal/m01-parkir', { kepala: h.izin })).status, 404, 'kunci paket bawaan tidak lewat sini');
  assert.equal((await api('GET', '/api/bank/soal/k-tidakada', { kepala: h.izin })).status, 404);

  // Sunting: id tetap, isi berganti; id yang tidak ada -> 404; isi tidak sah -> 400.
  const disunting = await api<{ ok: boolean; soal: SoalKustom }>('PUT', `/api/bank/soal/${id}`, {
    kepala: h.izin,
    json: kiriman({ title: 'Judul sesudah disunting', tingkat: 3, id: 'k-dipaksa1' }),
  });
  assert.equal(disunting.status, 200);
  assert.equal(disunting.badan.soal.id, id);
  assert.equal((await api<BankSoal>('GET', '/api/bank')).badan.soal.find((s) => s.id === id)?.judul, 'Judul sesudah disunting');
  assert.equal((await api('PUT', '/api/bank/soal/k-tidakada', { kepala: h.izin, json: kiriman() })).status, 404);
  assert.equal((await api('PUT', '/api/bank/soal/m01-parkir', { kepala: h.izin, json: kiriman() })).status, 404);
  assert.equal((await api('PUT', `/api/bank/soal/${id}`, { kepala: h.izin, json: kiriman({ steps: [] }) })).status, 400);

  // Hapus: soal keluar dari bank dan dari playlist room yang masih di lobby.
  const setel = await rpc<{ playlist: string[] }>(h.sock, 'host:playlist', { code: h.code, hostToken: h.hostToken, playlist: [id, 'm01-parkir'] });
  assert.deepEqual(setel.data?.playlist, [id, 'm01-parkir']);
  assert.deepEqual((await api('DELETE', `/api/bank/soal/${id}`, { kepala: h.izin })).badan, { ok: true });
  assert.equal((await api('DELETE', `/api/bank/soal/${id}`, { kepala: h.izin })).status, 404);
  assert.equal((await api<BankSoal>('GET', '/api/bank')).badan.soal.some((s) => s.id === id), false);
  const sesudah = await rpc<{ playlist: string[] }>(h.sock, 'host:playlist', { code: h.code, hostToken: h.hostToken });
  assert.deepEqual(sesudah.data?.playlist, ['m01-parkir']);

  srv.manager.close(h.code);
});

test('unggah gambar: PNG diterima; SVG & berkas terlalu besar ditolak; penyajian aman', async () => {
  const h = await buatRoom('Gambar');

  const ok1 = await api<{ ok: boolean; src: string }>('POST', '/api/bank/gambar', { kepala: h.izin, byte: PNG });
  assert.equal(ok1.status, 200);
  assert.match(ok1.badan.src, /^\/gambar-soal\/[a-f0-9]{32}\.png$/);
  // Nama = hash isi: unggah ulang berkas yang sama -> alamat yang sama; ekstensi dari isi, bukan dari Content-Type.
  const ok2 = await api<{ src: string }>('POST', '/api/bank/gambar', { kepala: h.izin, byte: PNG, jenis: 'image/jpeg' });
  assert.equal(ok2.badan.src, ok1.badan.src);
  assert.ok(fs.existsSync(path.join(DIR, 'gambar-soal', path.basename(ok1.badan.src))), 'tersimpan di sebelah berkas DB');

  const berkas = await fetch(BASE + ok1.badan.src);
  assert.equal(berkas.status, 200);
  assert.equal(berkas.headers.get('content-type'), 'image/png');
  assert.match(berkas.headers.get('cache-control') ?? '', /max-age=86400/);
  assert.equal(berkas.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(Buffer.from(await berkas.arrayBuffer()), PNG);

  // SVG: ditolak baik terus terang maupun menyamar sebagai PNG.
  for (const jenis of ['image/svg+xml', 'image/png', 'image/webp']) {
    const svg = await api<{ ok: boolean; error: string }>('POST', '/api/bank/gambar', { kepala: h.izin, byte: SVG, jenis });
    assert.equal(svg.status, 415, jenis);
    assert.deepEqual(svg.badan, { ok: false, error: 'Gambar harus berupa PNG, JPEG, atau WebP.' });
  }
  assert.equal((await api('POST', '/api/bank/gambar', { kepala: h.izin, byte: Buffer.from('GIF89a' + 'x'.repeat(64)), jenis: 'image/gif' })).status, 415);
  assert.equal((await api('POST', '/api/bank/gambar', { kepala: h.izin, byte: Buffer.from('{"a":1}'), jenis: 'application/json' })).status, 415);

  // Terlalu besar (> 3 MB) walau berkepala PNG yang sah.
  const besar = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
  const tolak = await api<{ ok: boolean; error: string }>('POST', '/api/bank/gambar', { kepala: h.izin, byte: besar });
  assert.equal(tolak.status, 413);
  assert.deepEqual(tolak.badan, { ok: false, error: 'Gambar terlalu besar. Maksimal 3 MB.' });
  assert.equal(fs.readdirSync(path.join(DIR, 'gambar-soal')).length, 1, 'yang ditolak tidak tersimpan');

  // Hanya nama berpola hash yang dilayani: tidak ada jalan keluar dari folder gambar.
  for (const jalur of [
    '/gambar-soal/..%2Fbank.db',
    '/gambar-soal/..%5Cbank.db',
    '/gambar-soal/%2e%2e/bank.db',
    '/gambar-soal/../bank.db',
    '/gambar-soal/bank.db',
    '/gambar-soal/',
    '/gambar-soal/a/b.png',
    `/gambar-soal/${'0'.repeat(32)}.png`,
    `/gambar-soal/${path.basename(ok1.badan.src)}/..%2F..%2Fbank.db`,
  ]) {
    const r = await fetch(BASE + jalur);
    const isi = Buffer.from(await r.arrayBuffer());
    assert.equal(isi.includes(Buffer.from('SQLite format')), false, jalur);
    // Jalur yang oleh URL dinormalkan keluar dari /gambar-soal jatuh ke rute lain (bukan berkas DB);
    // yang tetap di bawah /gambar-soal harus 404, tidak pernah halaman SPA.
    if (new URL(BASE + jalur).pathname.startsWith('/gambar-soal')) assert.equal(r.status, 404, jalur);
  }

  // Soal memakai gambar unggahan; alamat lain ditolak validasi.
  const luar = await api<{ rincian: string[] }>('POST', '/api/bank/soal', {
    kepala: h.izin,
    json: kiriman({ image: { src: `/gambar-soal/${'f'.repeat(32)}.png`, alt: 'x' } }),
  });
  assert.deepEqual(luar.badan.rincian, ['Berkas gambar tidak ditemukan. Unggah ulang gambarnya.']);
  const dua = await Promise.all(
    ['Soal gambar 1', 'Soal gambar 2'].map((title) =>
      api<{ soal: SoalKustom }>('POST', '/api/bank/soal', { kepala: h.izin, json: kiriman({ title, image: { src: ok1.badan.src, alt: 'Mobil penyok' } }) }),
    ),
  );
  assert.equal((await api<BankSoal>('GET', '/api/bank')).badan.soal.find((s) => s.id === dua[0].badan.soal.id)?.gambar, ok1.badan.src);
  // Gambar dipakai dua soal: baru dihapus dari disk setelah soal terakhir yang memakainya dihapus.
  await api('DELETE', `/api/bank/soal/${dua[0].badan.soal.id}`, { kepala: h.izin });
  assert.equal((await fetch(BASE + ok1.badan.src)).status, 200);
  await api('DELETE', `/api/bank/soal/${dua[1].badan.soal.id}`, { kepala: h.izin });
  assert.equal((await fetch(BASE + ok1.badan.src)).status, 404);

  srv.manager.close(h.code);
});

test('playlist kustom lewat socket: 3 soal sampai FINISHED, kunci baru keluar saat REVEAL', async () => {
  const h = await buatRoom('Acara Kustom');
  const { code, hostToken } = h;
  await rpc(h.sock, 'host:settings', { code, hostToken, autoAdvance: false });

  const gambar = (await api<{ src: string }>('POST', '/api/bank/gambar', { kepala: h.izin, byte: PNG })).badan.src;
  const k1 = (await api<{ soal: SoalKustom }>('POST', '/api/bank/soal', { kepala: h.izin, json: kiriman({ image: { src: gambar, alt: 'Mobil penyok di parkiran' } }) })).badan.soal;
  const k2 = (
    await api<{ soal: SoalKustom }>('POST', '/api/bank/soal', {
      kepala: h.izin,
      json: kiriman({
        title: 'Hitung peti',
        product: 'CARGO',
        steps: [{ kind: 'number', prompt: 'Berapa peti yang rusak?', nilai: 4, unit: 'peti', penjelasan: 'PENJELASAN-RAHASIA: empat peti rusak.' }],
      }),
    })
  ).badan.soal;

  // host:attach & host:playlist (baca) mengembalikan playlist bawaan; pemain tidak bisa membacanya.
  const attach = await rpc<{ playlist: string[]; state: RoomPublicState }>(h.sock, 'host:attach', { code, hostToken });
  assert.deepEqual(attach.data?.playlist, MISSIONS.map((m) => m.id));
  assert.equal('playlist' in attach.data!.state, false, 'playlist tidak ada di state publik');
  const pemain = await connect();
  assert.equal((await rpc(pemain, 'host:playlist', { code, hostToken: 'palsu' })).ok, false);
  assert.equal((await rpc(pemain, 'host:playlist', { code })).ok, false);

  const tolak = async (playlist: unknown, pola: RegExp) => {
    const r = await rpc(h.sock, 'host:playlist', { code, hostToken, playlist });
    assert.equal(r.ok, false, JSON.stringify(playlist));
    assert.match(r.error!, pola);
  };
  await tolak([k1.id, 'k-hantuuuu'], /tidak ada di bank soal/);
  await tolak([k1.id, TIEBREAK_MISSION.id], /tidak ada di bank soal/);
  await tolak([k1.id, 'm05-polis-mana', k1.id], /dua kali/);
  await tolak([], /1 sampai 20/);
  await tolak(Array.from({ length: 21 }, () => k1.id), /1 sampai 20/);
  await tolak('semua', /daftar id soal/);

  const playlist = [k1.id, 'm05-polis-mana', k2.id];
  const siaran = waitState(pemain, (s) => s.totalRounds === 3, 'totalRounds 3');
  await rpc(pemain, 'spectator:join', { code });
  const setel = await rpc<{ playlist: string[] }>(h.sock, 'host:playlist', { code, hostToken, playlist });
  assert.deepEqual(setel.data, { playlist });
  const lobby = await siaran;
  assert.equal(lobby.phase, 'LOBBY');
  assert.equal(JSON.stringify(lobby).includes(k2.id), false, 'isi playlist tidak disiarkan');

  const ani = await connect();
  const gabung = await rpc<{ playerToken: string }>(ani, 'player:join', { code, nickname: 'Ani' });
  assert.equal(gabung.ok, true, gabung.error);
  const token = gabung.data!.playerToken;

  const jawaban: Record<string, unknown>[] = [{ s1: 'o1' }, { cocok: { 'kasus-a': 'lanjut', 'kasus-b': 'tidak-ambang' } }, { s1: 4 }];
  const mulai = waitState(h.sock, (s) => s.phase === 'BRIEFING' && s.roundIndex === 0, 'BRIEFING 1');
  await rpc(h.sock, 'host:action', { code, hostToken, action: 'startMatch' });
  await mulai;

  await tolak(['m01-parkir'], /hanya bisa diubah saat lobby/);
  const hapus = await api<{ ok: boolean; error: string }>('DELETE', `/api/bank/soal/${k2.id}`, { kepala: h.izin });
  assert.equal(hapus.status, 409, 'soal di playlist room yang berjalan tidak boleh dihapus');
  assert.match(hapus.badan.error, /sedang dipakai/);

  for (let i = 0; i < 3; i++) {
    const aktif = waitState(h.sock, (s) => s.phase === 'ACTIVE' && s.roundIndex === i, `ACTIVE ${i + 1}`);
    await rpc(h.sock, 'host:action', { code, hostToken, action: 'next' });
    const st = await aktif;
    assert.equal(st.totalRounds, 3);
    assert.equal(st.mission?.id, playlist[i]);
    assert.equal(st.mission?.number, i + 1);
    assert.equal(st.reveal, null);
    assert.equal(JSON.stringify(st).includes('PENJELASAN-RAHASIA'), false, 'kunci tidak keluar sebelum REVEAL');
    if (i === 0) {
      assert.equal(st.mission?.scene, 'gambar');
      assert.deepEqual(st.mission?.image, { src: gambar, alt: 'Mobil penyok di parkiran' });
      assert.equal(st.mission?.level, 2);
    }

    const kirim = await rpc<{ accepted: boolean }>(ani, 'player:submit', { code, playerToken: token, roundIndex: i, answer: jawaban[i] });
    assert.equal(kirim.ok, true, kirim.error);

    const reveal = waitState(h.sock, (s) => s.phase === 'REVEAL' && s.roundIndex === i, `REVEAL ${i + 1}`);
    await rpc(h.sock, 'host:action', { code, hostToken, action: 'closeRound' });
    const rv = await reveal;
    assert.equal(rv.reveal?.missionId, playlist[i]);
    assert.equal(rv.reveal?.roundIndex, i);
    assert.equal(rv.leaderboard?.[0].totalAccuracy, i + 1, 'jawaban tepat di setiap soal');
    if (i === 0) {
      assert.deepEqual(rv.reveal?.steps[0].correctText, ['Foto penyok pintu kiri']);
      assert.match(rv.reveal!.steps[0].explanation, /PENJELASAN-RAHASIA/);
      assert.equal(rv.reveal?.terjemahan, undefined, 'soal kustom tanpa terjemahan');
    }
    if (i === 1) assert.ok(rv.reveal?.terjemahan?.en, 'misi bawaan tetap membawa terjemahan pembahasan');
    if (i === 2) assert.deepEqual(rv.reveal?.steps[0].correctText, ['4 peti']);

    const papan = waitState(h.sock, (s) => s.phase === 'LEADERBOARD', `LEADERBOARD ${i + 1}`);
    await rpc(h.sock, 'host:action', { code, hostToken, action: 'next' });
    await papan;
    if (i < 2) {
      const lanjut = waitState(h.sock, (s) => s.phase === 'BRIEFING' && s.roundIndex === i + 1, `BRIEFING ${i + 2}`);
      await rpc(h.sock, 'host:action', { code, hostToken, action: 'next' });
      await lanjut;
    }
  }

  const selesai = waitState(h.sock, (s) => s.phase === 'FINISHED', 'FINISHED');
  const saya = new Promise<MePrivate>((resolve) => ani.on('me', (m: MePrivate) => m.badges.length > 0 && resolve(m)));
  await rpc(h.sock, 'host:action', { code, hostToken, action: 'next' });
  const fin = await selesai;
  assert.equal(fin.totalRounds, 3);
  assert.equal(fin.roundIndex, 2);
  assert.equal(fin.podium?.[0].answeredCount, 3);
  assert.deepEqual((await saya).badges.map((b) => b.id).sort(), ['juara', 'kilat', 'lengkap', 'tepat-sasaran']);

  const csv = await (await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`)).text();
  assert.match(csv, /misi3_poin/);
  assert.equal(csv.includes('misi4_poin'), false);
  assert.match(csv, /# misi 3,Hitung peti,CARGO - Pengangkutan Barang,30/);
  const json = (await (await fetch(`${BASE}/api/room/${code}/results.json?hostToken=${hostToken}`)).json()) as { players: { rounds: unknown[] }[] };
  assert.equal(json.players[0].rounds.length, 3);
  const matches = (await (await fetch(`${BASE}/api/matches`)).json()) as { matches: { code: string }[] };
  assert.ok(matches.matches.some((m) => m.code === code), 'hasil tersimpan di SQLite');

  // Setelah selesai soal boleh dihapus; ekspor room yang sudah selesai tetap utuh (salinan beku).
  assert.equal((await api('DELETE', `/api/bank/soal/${k2.id}`, { kepala: h.izin })).status, 200);
  const csvLagi = await (await fetch(`${BASE}/api/room/${code}/results.csv?hostToken=${hostToken}`)).text();
  assert.match(csvLagi, /# misi 3,Hitung peti/);
  await api('DELETE', `/api/bank/soal/${k1.id}`, { kepala: h.izin });
  srv.manager.close(code);
});

test('practice/grade & /api/missions: hanya paket latihan + tutorial', async () => {
  const h = await buatRoom('Pagar');
  const k = (await api<{ soal: SoalKustom }>('POST', '/api/bank/soal', { kepala: h.izin, json: kiriman() })).badan.soal;

  const nilai = (missionId: unknown, answer: unknown = {}) =>
    api<{ ok: boolean; accuracy?: number; error?: string; reveal?: unknown }>('POST', '/api/practice/grade', {
      json: { missionId, answer, elapsedSeconds: 5 },
    });

  const latihan = await nilai('m01-parkir', { s1: 'dokumentasi' });
  assert.equal(latihan.status, 200);
  assert.equal(latihan.badan.accuracy, 1);
  assert.equal((await nilai('tutorial', { latihan: 'helm' })).badan.accuracy, 1);
  assert.equal((await nilai(TIEBREAK_MISSION.id)).status, 200, 'penentuan boleh di luar production');

  for (const id of [k.id, MISSIONS_ACARA[0]?.id ?? 'a01-contoh', 'tidak-ada', '', null, 42, { toString: 1 }, ['m01-parkir']]) {
    const r = await nilai(id, { s1: 'o1' });
    assert.equal(r.status, 404, JSON.stringify(id));
    assert.deepEqual(r.badan, { ok: false, error: 'Misi tidak ditemukan' });
    assert.equal(JSON.stringify(r.badan).includes('PENJELASAN-RAHASIA'), false);
  }

  const lama = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.equal((await nilai(TIEBREAK_MISSION.id)).status, 404, 'production: ronde penentuan tidak bisa dipancing');
  assert.equal((await nilai('m01-parkir', { s1: 'dokumentasi' })).status, 200);
  process.env.NODE_ENV = lama;

  const misi = await api<{ missions: { id: string; level?: number }[] }>('GET', '/api/missions');
  assert.deepEqual(misi.badan.missions.map((m) => m.id), MISSIONS.map((m) => m.id));
  assert.ok(misi.badan.missions.every((m) => m.level === 1 || m.level === 2 || m.level === 3));
  const mentah = JSON.stringify(misi.badan);
  assert.equal(mentah.includes(k.id), false, 'soal kustom tidak ada di /api/missions');
  assert.equal(mentah.includes('explanation'), false);

  await api('DELETE', `/api/bank/soal/${k.id}`, { kepala: h.izin });
  srv.manager.close(h.code);
});

test('PIN panitia: wajib untuk membuat room & menulis bank; salah berulang -> ditahan', async () => {
  // Room dibuat sebelum PIN dipasang (mis. PIN baru diaktifkan): tokennya saja tidak cukup lagi.
  const lama = await buatRoom('Sebelum PIN');
  CONFIG.panitiaPin = '2468';
  srv.resetPembatasPin();
  try {
    assert.equal((await api<{ butuhPin: boolean }>('GET', '/api/config')).badan.butuhPin, true);
    assert.equal(JSON.stringify((await api('GET', '/api/config')).badan).includes('2468'), false);

    const s = await connect();
    for (const pin of [undefined, '', '0000', 2468, ['2468'], { toString: 1 }]) {
      const r = await rpc(s, 'host:create', { eventName: 'Tanpa izin', pin });
      assert.equal(r.ok, false, JSON.stringify(pin));
      assert.equal(r.error, 'PIN panitia salah');
    }
    srv.resetPembatasPin(); // jatah salah dihitung per alamat (socket & REST berbagi jatah)
    const h = await buatRoom('Dengan PIN', { pin: '2468' });

    // Bank: baca ringkasan tetap terbuka; tulis/buka kunci butuh token host DAN PIN.
    assert.equal((await api('GET', '/api/bank')).status, 200);
    for (const izin of [h.izin, lama.izin, { ...h.izin, 'x-panitia-pin': '1111' }]) {
      const r = await api<{ error: string }>('POST', '/api/bank/soal', { kepala: izin, json: kiriman() });
      assert.equal(r.status, 403);
      assert.equal(r.badan.error, 'PIN panitia salah');
    }
    assert.equal((await api('POST', '/api/bank/gambar', { kepala: h.izin, byte: PNG })).status, 403);
    assert.equal((await api('POST', '/api/bank/soal', { kepala: { 'x-panitia-pin': '2468' }, json: kiriman() })).status, 403, 'PIN saja tanpa token host tidak cukup');
    const denganPin = { ...h.izin, 'x-panitia-pin': '2468' };
    const dibuat = await api<{ soal: SoalKustom }>('POST', '/api/bank/soal', { kepala: denganPin, json: kiriman() });
    assert.equal(dibuat.status, 200);
    assert.equal((await api('GET', `/api/bank/soal/${dibuat.badan.soal.id}`, { kepala: h.izin })).status, 403);
    assert.equal((await api('GET', `/api/bank/soal/${dibuat.badan.soal.id}`, { kepala: denganPin })).status, 200);
    assert.equal((await api('DELETE', `/api/bank/soal/${dibuat.badan.soal.id}`, { kepala: denganPin })).status, 200);

    // Rem tebak-tebakan: setelah 8 PIN salah dari alamat yang sama, PIN benar pun ditahan sementara.
    srv.resetPembatasPin();
    for (let i = 0; i < 8; i++) assert.equal((await rpc(s, 'host:create', { pin: `salah-${i}` })).error, 'PIN panitia salah');
    const ditahan = await rpc(s, 'host:create', { pin: '2468' });
    assert.equal(ditahan.ok, false);
    assert.match(ditahan.error!, /Terlalu banyak percobaan PIN/);
    srv.resetPembatasPin();
    assert.equal((await rpc(s, 'host:create', { pin: '2468' })).ok, true);
  } finally {
    CONFIG.panitiaPin = '';
    srv.resetPembatasPin();
  }
  // Tanpa PIN: kembali terbuka seperti halaman host.
  assert.equal((await rpc(await connect(), 'host:create', { eventName: 'Terbuka lagi' })).ok, true);
});
