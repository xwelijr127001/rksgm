/** T-038 regression tests: CSV formula guard, PIN brake (per IP + global), origin policy, limiter bound. */
import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_BASE_URL = 'https://game.contoh.id';
process.env.RAKSA_ORIGINS = '';

/* eslint-disable @typescript-eslint/no-require-imports */
const { csvCell } = require('./csvGuard') as typeof import('./csvGuard');
const { buildResultsCsv } = require('./csv') as typeof import('./csv');
const { PembatasPin, asalDiizinkan, legacyTanpaPin } = require('./keamanan') as typeof import('./keamanan');
const { RateLimiter } = require('./story/auth/rateLimit') as typeof import('./story/auth/rateLimit');
const { CONFIG } = require('./config') as typeof import('./config');

test('csvCell: formula prefixes, leading whitespace and control characters get an apostrophe', () => {
  for (const v of ['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\t=1', '\r=1', ' =HYPERLINK("x")', ' =1', '\u0000=1', '﻿=1', '＝1+1', '　=1']) {
    const c = csvCell(v);
    assert.ok(c.startsWith("'") || c.startsWith(`"'`), `${JSON.stringify(v)} -> ${c}`);
  }
  assert.equal(csvCell('Ani'), 'Ani');
  assert.equal(csvCell(120), '120');
  assert.equal(csvCell('0.750'), '0.750');
  assert.equal(csvCell('a;b'), '"a;b"');
  assert.equal(csvCell('=a,b'), `"'=a,b"`);
});

test('legacy export: every user-controlled field is guarded', () => {
  const pemain = { id: 'p1', nickname: '=HYPERLINK("http://x","klik")', totalPoints: 10, totalAccuracy: 0.5, totalTimeMs: 1000, rounds: [] };
  const room = {
    code: 'ABCD',
    settings: { eventName: '+cmd|calc', prizes: { first: '@SUM(1)', second: '', third: '' } },
    totalRounds: 1,
    tiebreakRound: 99,
    tiebreakUsed: false,
    podium: [{ playerId: 'p1', rank: 1 }],
    leaderboard: null,
    players: new Map([['p1', pemain]]),
    lencana: () => [{ label: '-1+1' }],
    missionForRound: () => ({ title: '=judul', productLabel: '\t=produk', durationSeconds: 30 }),
  };
  const csv = buildResultsCsv(room as never);
  for (const bahaya of ['=HYPERLINK', '+cmd', '@SUM', '-1+1', '=judul', '\t=produk']) {
    const sel = csv.split(/\r\n/).flatMap((l: string) => l.split(','));
    assert.ok(!sel.some((c: string) => c.startsWith(bahaya) || c.startsWith(`"${bahaya}`)), `tidak terjaga: ${bahaya}`);
  }
  assert.match(csv, /'=HYPERLINK/);
});

test('PIN brake: 8 failures lock one IP; a saturated global budget stops ALL PIN verification until it expires', () => {
  let kini = 1_000_000;
  const b = new PembatasPin(() => kini);
  for (let i = 0; i < 8; i++) assert.equal(b.cek('0000', '1.1.1.1', '2468'), 'salah');
  assert.equal(b.cek('2468', '1.1.1.1', '2468'), 'terkunci');
  assert.equal(b.cek('2468', '2.2.2.2', '2468'), 'ok', 'IP lain tidak ikut terkunci');
  // 52 more failures from many IPs (60 total) -> global budget saturated.
  for (let i = 0; i < 52; i++) b.cek('0000', `10.0.${i}.1`, '2468');
  assert.equal(b.cek('0000', '3.3.3.3', '2468'), 'terkunci', 'PIN salah saat jenuh: terkunci');
  assert.equal(b.cek('2468', '3.3.3.3', '2468'), 'terkunci', 'PIN BENAR saat jenuh: tidak diperiksa, terkunci');
  kini += 9 * 60_000;
  assert.equal(b.cek('2468', '7.7.7.7', '2468'), 'terkunci', 'masih terkunci selama 10 menit');
  kini += 60_000 + 1;
  assert.equal(b.cek('2468', '3.3.3.3', '2468'), 'ok', 'kunci lepas: PIN benar berlaku lagi');
  assert.equal(b.cek('0000', '6.6.6.6', '2468'), 'salah', 'kunci lepas: PIN salah biasa lagi');
  assert.equal(b.cek('apa saja', '4.4.4.4', ''), 'ok', 'tanpa PIN terpasang: terbuka');
});

test('origins: same-origin, public URL and listed origins only; production drops LAN/loopback', () => {
  const h = { host: 'game.contoh.id' };
  assert.equal(asalDiizinkan(undefined, h), true);
  assert.equal(asalDiizinkan('http://game.contoh.id', h), true, 'tanpa hop terpercaya: http + Host');
  assert.equal(asalDiizinkan('https://game.contoh.id', h), true, 'PUBLIC_BASE_URL');
  const lamaHop = CONFIG.trustProxyHops;
  CONFIG.trustProxyHops = 1;
  try {
    const tls = { host: '127.0.0.1:4000', 'x-forwarded-host': 'main.contoh.id', 'x-forwarded-proto': 'https' };
    assert.equal(asalDiizinkan('https://main.contoh.id', tls), true, 'skema + host dari hop terpercaya');
    assert.equal(asalDiizinkan('http://main.contoh.id', tls), false, 'skema lain di host sama ditolak');
    assert.equal(asalDiizinkan('https://main.contoh.id:8443', tls), false, 'port lain ditolak');
  } finally {
    CONFIG.trustProxyHops = lamaHop;
  }
  assert.equal(asalDiizinkan('https://penyerang.example', h), false);
  assert.equal(asalDiizinkan('null', h), false);
  assert.equal(asalDiizinkan('https://game.contoh.id', { host: '127.0.0.1:4000' }), true, 'PUBLIC_BASE_URL');
  CONFIG.origins = ['https://raksaonline.com'];
  assert.equal(asalDiizinkan('https://raksaonline.com', h), true);
  CONFIG.origins = [];
  assert.equal(asalDiizinkan('http://localhost:5173', h), true, 'dev: Vite');
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(asalDiizinkan('http://localhost:5173', h), false);
  } finally {
    process.env.NODE_ENV = 'test';
  }
});

test('legacy in production needs PANITIA_PIN', () => {
  const lama = { legacy: CONFIG.legacy, pin: CONFIG.panitiaPin };
  process.env.NODE_ENV = 'production';
  try {
    CONFIG.legacy = true;
    CONFIG.panitiaPin = '';
    assert.equal(legacyTanpaPin(), true);
    CONFIG.panitiaPin = '2468';
    assert.equal(legacyTanpaPin(), false);
  } finally {
    process.env.NODE_ENV = 'test';
    CONFIG.legacy = lama.legacy;
    CONFIG.panitiaPin = lama.pin;
  }
});

test('RateLimiter keeps at most maxKeys keys', () => {
  const r = new RateLimiter(5, 60_000, () => 0, 100);
  for (let i = 0; i < 1000; i++) r.record(`k${i}`);
  assert.ok((r as unknown as { hits: Map<string, unknown> }).hits.size <= 101);
});
