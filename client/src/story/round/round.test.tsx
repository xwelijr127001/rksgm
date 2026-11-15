import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RoundLayout } from '../../../../shared/story/content';
import type { StoryConsequenceView, StoryEvidence, StoryOption, StoryPhase, StorySceneLine, StoryScenePublic } from '../../../../shared/story/protocol';
import type { RoomAsset } from '../stage/StoryStage';
import { AnnouncementContext } from './announcer';
import { DecisionTray, type DecisionTrayProps } from './DecisionTray';
import { EvidenceList } from './EvidenceList';
import { EvidenceSheet, PictureSheet } from './EvidenceSheet';
import { OutcomeBlock } from './OutcomeBlock';
import { RoundHeader } from './RoundHeader';
import { roundViewOf, type RoundView, type RoundViewMode } from './roundModel';
import { RoundSurface } from './RoundSurface';

// Synthetic content (a delayed parcel); no settled-case text.
const NOW = 1_000_000;
const now = () => NOW;
const count = (html: string, s: string | RegExp) => (typeof s === 'string' ? html.split(s).length - 1 : (html.match(new RegExp(s, 'g')) ?? []).length);
/** React's server renderer hoists an image preload hint in front of the markup. */
const withoutPreload = (html: string) => html.replace(/<link rel="preload" as="image"[^>]*\/>/g, '');
const line = (id: string, pos: number, speaker: StorySceneLine['speaker'], name: string | null, text: string): StorySceneLine => ({ id, pos, speaker, name, text });

const CHECKLIST: StoryEvidence = {
  id: 'v_daftar',
  kind: 'checklist',
  kicker: '',
  title: 'Daftar berkas paket',
  body: '',
  assetId: null,
  spot: { x: 20, y: 40 },
  rows: [
    { id: 'w1', mark: 'ok', label: 'Foto kardus', value: '' },
    { id: 'w2', mark: 'check', label: 'Resi', value: 'Nomor buram' },
    { id: 'w3', mark: 'none', label: 'Catatan gudang', value: '' },
  ],
};
const PHOTO: StoryEvidence = { id: 'v_foto', kind: 'photo', kicker: '', title: 'Foto label', body: 'Label tertulis rapuh.', assetId: 'asset:foto-label', spot: null, rows: [] };
/** Carries the author's own label ("Surat") instead of the kind word. */
const DOC: StoryEvidence = { id: 'v_surat', kind: 'document', kicker: 'Surat', title: 'Surat gudang', body: 'Baris satu.\nBaris dua.', assetId: null, spot: { x: 70, y: 30 }, rows: [] };

function scene(layout: RoundLayout, over: Partial<StoryScenePublic> = {}): StoryScenePublic {
  return {
    roundId: 'r03',
    roundNumber: 3,
    title: 'Paket tertahan di gudang',
    meta: 'Laporan · Hari ke-2',
    keyRound: true,
    layout,
    prompt: 'Apa langkahmu sekarang?',
    backgroundAssetId: 'asset:latar-gudang',
    showOfficer: false,
    mediaAssetId: null,
    intro: [],
    lines: [line('l1', 0, 'narrator', null, 'Pesan masuk pagi ini.'), line('l2', 1, 'customer', 'Pak Joko', 'Paket saya belum sampai.')],
    action: '',
    evidence: [CHECKLIST, PHOTO, DOC],
    respondent: { speaker: 'customer', name: 'Pak Joko' },
    lesson: '',
    ...over,
  };
}

const OPTIONS: StoryOption[] = ['Minta resi lalu cek gudang hari ini.', 'Tunggu kabar kurir besok pagi saja.', 'Janjikan paket tiba nanti sore.', 'Arahkan Pak Joko ke toko penjual.', 'Kirim paket pengganti sekarang juga.'].map((text, i) => ({ handle: `h${i + 1}`, text, form: 'message' }));
/** The same round with its fourth option as an action without a message. */
const WITH_ACTION: StoryOption[] = OPTIONS.map((o) => (o.handle === 'h4' ? { handle: 'h4', text: 'Tutup tiket dulu tanpa membalas.', form: 'action' } : o));

function tray(over: Partial<DecisionTrayProps> = {}): string {
  const props: DecisionTrayProps = {
    options: OPTIONS,
    layout: 'chat',
    actionLabel: 'Kirim balasan',
    phase: 'answering',
    sentHandle: null,
    disabled: false,
    endsAt: NOW + 21_400,
    durationMs: 30_000,
    now,
    onSubmit: async () => ({ ok: true }),
    ...over,
  };
  return renderToStaticMarkup(<DecisionTray {...props} />);
}

test('DecisionTray: five option cards as one radio group, no A–E letters, one confirm button and one timer', () => {
  const html = tray();
  assert.equal(count(html, 'role="radiogroup"'), 1);
  assert.match(html, /role="radiogroup" aria-label="Draf balasan"/);
  assert.equal(count(html, 'role="radio"'), 5);
  assert.equal(count(html, 'data-pilihan="'), 5);
  assert.equal(count(html, 'aria-checked="false"'), 5, 'nothing selected yet');
  assert.equal(count(html, 'tabindex="0"'), 1, 'one tab stop (roving): the first option until one is chosen');
  assert.doesNotMatch(html, /sr-opsi-huruf|>[A-E]<\/span>/, 'no letters as the focus of an option');
  for (const o of OPTIONS) assert.ok(html.includes(o.text));
  assert.equal(count(html, 'data-kirim'), 1);
  assert.match(html, /data-kirim="">Kirim balasan<\/button>/);
  assert.equal(count(html, 'data-timer'), 1);
  assert.match(html, /role="timer" aria-label="Sisa waktu menjawab 22 detik"/);
  assert.doesNotMatch(html, /Tepat|Keliru|Kurang tepat/, 'no correctness before close');
});

test('DecisionTray: the reading phase shows when the options open; nothing after close', () => {
  const reading = tray({ phase: 'scene', options: null, endsAt: NOW + 8_200 });
  assert.match(reading, /Pilihan dibuka dalam 9 detik/);
  assert.match(reading, /Lima draf balasan muncul di sini/);
  assert.equal(count(reading, 'data-pilihan'), 0);
  assert.match(tray({ phase: 'scene', options: null, endsAt: NOW - 1 }), /Pilihan segera dibuka…/, 'readiness grace: no countdown restart');
  assert.match(tray({ phase: 'scene', options: null, layout: 'dossier' }), /Lima pilihan tindakan muncul di sini/);
  assert.equal(tray({ phase: 'consequence', options: null }), '');
  assert.equal(tray({ phase: 'leaderboard', options: null }), '');
});

test('DecisionTray: the round own action label, a time-up state, and options still on their way shown as a wait', () => {
  assert.match(tray({ layout: 'dossier', actionLabel: 'Ajukan berkas' }), /role="radiogroup" aria-label="Pilihan tindakan"[\s\S]*data-kirim="">Ajukan berkas</);
  const late = tray({ endsAt: NOW - 1 });
  assert.equal(count(late, 'disabled=""'), 6, 'five options and the button');
  assert.match(late, /Waktu habis\. Babak ini tercatat tanpa jawaban/);
  const offline = tray({ disabled: true });
  assert.equal(count(offline, 'disabled=""'), 6);
  // The answers are open but this device's options have not arrived (the private snapshot follows the public one).
  const catchingUp = tray({ options: null });
  assert.match(catchingUp, /<p class="sr-baki-tunggu-judul">Pilihan segera dibuka…<\/p>/);
  assert.doesNotMatch(catchingUp, /masuk setelah|dilewati|data-kirim|data-pilihan/, 'never the "joined late" message');
});

const KEY = 'raksa:story:pilih:K7M2QX:r03';

/** Renders with `handle` restored as this tab's selection for KEY (a static render cannot click). */
function withDraft<T>(handle: string, render: () => T): T {
  const g = globalThis as { window?: unknown };
  g.window = { sessionStorage: { getItem: (k: string) => (k === KEY ? handle : null), setItem: () => undefined, removeItem: () => undefined } };
  try {
    return render();
  } finally {
    delete g.window;
  }
}

test('DecisionTray: a selection kept for this room and round is restored after a reload', () => {
  withDraft('h3', () => {
    const html = tray({ persistKey: KEY });
    assert.equal(count(html, 'aria-checked="true"'), 1);
    assert.match(html, /aria-checked="true" tabindex="0" class="sr-opsi-kartu" data-pilihan="h3"/);
    assert.equal(count(tray({ persistKey: 'raksa:story:pilih:K7M2QX:r04' }), 'aria-checked="true"'), 0, 'another round starts empty');
  });
});

test('DecisionTray: the cards carry no form mark; in a chat the confirm label follows the chosen option', () => {
  const html = tray({ options: WITH_ACTION });
  assert.doesNotMatch(html, /sr-opsi-bentuk|bukan pesan|>Tindakan</, 'the text itself says what an option does');
  assert.match(html, /data-pilihan="h4"[^>]*><span class="sr-opsi-tanda" aria-hidden="true"><\/span><span class="sr-opsi-teks">Tutup tiket dulu tanpa membalas\.<\/span><\/button>/);
  assert.match(html, /data-kirim="">Kirim balasan<\/button>/, 'nothing chosen yet: the round label');
  const chosen = (handle: string, over: Partial<DecisionTrayProps> = {}) => withDraft(handle, () => tray({ options: WITH_ACTION, persistKey: KEY, ...over }));
  assert.match(chosen('h4'), /data-kirim="">Tetapkan tindakan<\/button>/, 'an action is confirmed as an action, never sent as a message');
  assert.match(chosen('h1'), /data-kirim="">Kirim balasan<\/button>/);
  assert.match(chosen('h4', { layout: 'dossier', actionLabel: 'Ajukan berkas' }), /data-kirim="">Ajukan berkas<\/button>/, 'other activities keep the round label');
});

test('DecisionTray: after the ACK the tray collapses to the sent state (a bubble in a chat), with the timer and no button', () => {
  const chat = tray({ sentHandle: 'h1' });
  assert.match(chat, /data-terkirim=""/);
  assert.match(chat, /sr-chat-baris sr-chat-keluar[\s\S]*Minta resi lalu cek gudang hari ini\.[\s\S]*Terkirim/);
  assert.equal(count(chat, 'data-kirim'), 0, 'nothing to send again');
  assert.equal(count(chat, 'data-pilihan'), 0);
  assert.equal(count(chat, 'data-timer'), 1);
  const card = tray({ layout: 'field', sentHandle: 'h2' });
  assert.match(card, /sr-terkirim-kartu[\s\S]*Ditetapkan[\s\S]*Tunggu kabar kurir besok pagi saja\./, 'a decision set, as the button said');
  assert.doesNotMatch(card, /Terkirim/);
  const unknown = tray({ sentHandle: 'tidak-dikenal' });
  assert.match(unknown, /data-terkirim=""[\s\S]*Terkirim/, 'a handle this device cannot name: no text, still sent');
  assert.doesNotMatch(unknown, /sr-chat-keluar|<p>/);
});

test('DecisionTray: a sent action is a note in a chat ("Kamu: …"), never an outgoing bubble; a card elsewhere', () => {
  const chat = tray({ options: WITH_ACTION, sentHandle: 'h4' });
  assert.match(chat, /data-terkirim=""[\s\S]*<div class="sr-terkirim-catatan"><div class="sr-chat-catatan"><span>Kamu: Tutup tiket dulu tanpa membalas\.<\/span><\/div><span class="sr-chat-status"><span aria-hidden="true">✓<\/span> Ditetapkan<\/span><\/div>/);
  assert.doesNotMatch(chat, /Terkirim/, 'nothing was sent to the contact: the action is recorded');
  assert.doesNotMatch(chat, /sr-chat-keluar|sr-chat-gelembung/, 'no outgoing bubble for an action');
  const message = tray({ options: WITH_ACTION, sentHandle: 'h1' });
  assert.match(message, /sr-chat-keluar[\s\S]*Minta resi lalu cek gudang hari ini\./, 'a message of the same round is still a bubble');
  const desk = tray({ options: WITH_ACTION, layout: 'dossier', sentHandle: 'h4' });
  assert.match(desk, /sr-terkirim-kartu[\s\S]*Ditetapkan[\s\S]*<p>Tutup tiket dulu tanpa membalas\.<\/p>/);
  assert.doesNotMatch(desk, /Kamu:/);
});

function outcome(over: Partial<StoryConsequenceView> = {}): StoryConsequenceView {
  return {
    roundId: 'r03',
    roundNumber: 3,
    outcome: 'kurang_tepat',
    chosenText: 'Tunggu kabar kurir besok pagi saja.',
    chosenForm: 'message',
    consequence: 'Pak Joko menunggu tanpa kabar.',
    reason: 'Alasan pilihan.',
    recommended: [{ text: 'Minta resi lalu cek gudang hari ini.', reason: '' }],
    mentorReason: '',
    delayedDelta: 0,
    moodBefore: 45,
    moodAfter: 35,
    bandBefore: 'ragu',
    bandAfter: 'kecewa',
    score: { accuracyPoints: 350, speedPoints: 210, roundScore: 560, elapsedMs: 9_000 },
    reply: 'Jadi saya harus menunggu lagi?',
    respondentName: 'Pak Joko',
    lesson: 'Beri kabar dan langkah yang jelas hari itu juga.',
    delayed: [],
    flagSet: null,
    ...over,
  };
}
const MOOD_WORDS = { sangat_kecewa: 'Marah', kecewa: 'Kesal', ragu: 'Bimbang', tenang: 'Lega', senang: 'Senang' };

test('OutcomeBlock (chat): story first (sent message, reply, outcome note), then the lesson, then badge and status', () => {
  const html = renderToStaticMarkup(<OutcomeBlock outcome={outcome()} layout="chat" officerName="Mentor Uji" moodLabels={MOOD_WORDS} />);
  assert.match(html, /^<div class="sr-hasil-blok sr-hasil-blok-chat" data-hasil="">/);
  assert.match(
    html,
    /sr-chat-keluar[\s\S]*Tunggu kabar kurir besok pagi saja\.[\s\S]*Terkirim[\s\S]*sr-chat-masuk[\s\S]*<span class="sr-only">Pak Joko: <\/span>[\s\S]*Jadi saya harus menunggu lagi\?[\s\S]*sr-chat-catatan[\s\S]*Pak Joko menunggu tanpa kabar\.[\s\S]*Catatan Mentor Uji<\/b><p>Beri kabar dan langkah yang jelas hari itu juga\.[\s\S]*Kurang tepat[\s\S]*Status: Bimbang → Kesal[\s\S]*Pilihan yang dianjurkan[\s\S]*Minta resi lalu cek gudang hari ini\./,
    'thread, lesson, the badge with the decision own change (scenario words, once), then the recommendation',
  );
  assert.doesNotMatch(html, /Alasan pilihan/, 'the lesson replaces the long reason');
});

test('OutcomeBlock (chat): a chosen action is a note in the thread ("Kamu: …"), never a sent message bubble', () => {
  const action = outcome({ chosenForm: 'action', chosenText: 'Tutup tiket dulu tanpa membalas.' });
  const html = renderToStaticMarkup(<OutcomeBlock outcome={action} layout="chat" officerName={null} moodLabels={null} />);
  assert.match(html, /<ol class="sr-chat-isi sr-hasil-utas" aria-label="Hasil tindakanmu"><li class="sr-terkirim-catatan"><div class="sr-chat-catatan"><span>Kamu: Tutup tiket dulu tanpa membalas\.<\/span><\/div><span class="sr-chat-status"><span aria-hidden="true">✓<\/span> Ditetapkan<\/span><\/li><li class="sr-chat-baris sr-chat-masuk">/, 'the same note and status as when it was decided');
  assert.doesNotMatch(html, /sr-chat-keluar|✓✓|Terkirim/);
  const card = renderToStaticMarkup(<OutcomeBlock outcome={action} layout="dossier" officerName={null} moodLabels={null} />);
  assert.match(card, /Pilihanmu<\/span> Tutup tiket dulu tanpa membalas\./, 'a result card names both forms the same way');
});

test('OutcomeBlock: the status is a band change, a trend within the band, or unchanged', () => {
  const html = (over: Partial<StoryConsequenceView>) => renderToStaticMarkup(<OutcomeBlock outcome={outcome(over)} layout="chat" officerName={null} moodLabels={MOOD_WORDS} />);
  assert.match(html({}), /<span class="sr-hasil-status">Status: Bimbang → Kesal<\/span>/);
  const same = { bandBefore: 'ragu', bandAfter: 'ragu', moodBefore: 45 } as const;
  assert.match(html({ ...same, moodAfter: 52 }), /<span class="sr-hasil-status">Status: Bimbang, sedikit membaik <span class="sr-hasil-tren-naik" aria-hidden="true">↗<\/span><\/span>/);
  assert.match(html({ ...same, moodAfter: 41 }), /<span class="sr-hasil-status">Status: Bimbang, sedikit menurun <span class="sr-hasil-tren-turun" aria-hidden="true">↘<\/span><\/span>/);
  assert.match(html({ ...same, moodAfter: 45 }), /<span class="sr-hasil-status">Status tetap: Bimbang<\/span>/);
});

test('OutcomeBlock: recommended only when not tepat; timeout; delayed notes; reason when a round has no lesson', () => {
  const right = renderToStaticMarkup(<OutcomeBlock outcome={outcome({ outcome: 'tepat', bandAfter: 'ragu', moodAfter: 45 })} layout="chat" officerName={null} moodLabels={null} />);
  assert.doesNotMatch(right, /dianjurkan/);
  assert.match(right, /Status tetap: Ragu-ragu/, 'default words without scenario words');
  assert.match(right, /<b>Pelajaran<\/b>/);
  const late = renderToStaticMarkup(<OutcomeBlock outcome={outcome({ outcome: 'timeout', chosenText: null, reply: 'Halo? Ada kabar?' })} layout="chat" officerName={null} moodLabels={null} />);
  assert.match(late, /Kamu tidak sempat membalas\.[\s\S]*Halo\? Ada kabar\?/);
  const promise = renderToStaticMarkup(<OutcomeBlock outcome={outcome({ delayedDelta: -12, delayed: [{ label: 'Janji kirim sore', fromRound: 1, delta: -12 }] })} layout="field" officerName={null} moodLabels={null} />);
  // The flag label is authored text (it may carry its own quotes), so the wording adds none around it.
  assert.match(promise, /<p class="sr-dampak">Dampak tertunda di awal babak ini — Janji kirim sore \(babak 1\): status −12\.<\/p><p class="sr-hasil-ringkas">/, 'the effect at the start reads before the status since then');
  const legacy = renderToStaticMarkup(<OutcomeBlock outcome={outcome({ delayedDelta: -5, lesson: '' })} layout="stage" officerName={null} moodLabels={null} />);
  assert.match(legacy, /Termasuk dampak keputusanmu di babak sebelumnya: −5/);
  assert.match(legacy, /<b>Alasan<\/b><p>Alasan pilihan\./);
});

test('OutcomeBlock (desk/field/stage): a result card, story first: own action, reply quote, outcome note, lesson, then the badge', () => {
  const html = renderToStaticMarkup(<OutcomeBlock outcome={outcome()} layout="dossier" officerName="Mentor Uji" moodLabels={MOOD_WORDS} />);
  assert.match(html, /^<section class="sr-hasil-blok sr-hasil-blok-kartu sr-hasil-blok-kurang_tepat" data-hasil="" aria-labelledby=/);
  assert.match(html, /<h2 [^>]*class="sr-hasil-judul">Hasil tindakanmu<\/h2>/);
  assert.match(html, /Pilihanmu<\/span> Tunggu kabar kurir besok pagi saja\./);
  assert.match(html, /<blockquote>Jadi saya harus menunggu lagi\?<\/blockquote><figcaption>— Pak Joko<\/figcaption>/);
  assert.match(html, /Pilihanmu[\s\S]*<blockquote>[\s\S]*sr-hasil-akibat[\s\S]*sr-pelajaran[\s\S]*sr-hasil-ringkas[\s\S]*sr-dianjurkan/);
});

const ASSETS: ReadonlyMap<string, RoomAsset> = new Map([['asset:latar-gudang', { id: 'asset:latar-gudang', kind: 'background', builtin: false, url: '/aset/latar.png', mime: 'image/png', title: 'Latar', variantUrls: {} }]]);

test('EvidenceSheet: a modal dialog with the label, the title, a close button and the content; rows only for list kinds', () => {
  assert.equal(renderToStaticMarkup(<EvidenceSheet item={null} assets={null} onClose={() => undefined} />), '');
  const html = renderToStaticMarkup(<EvidenceSheet item={CHECKLIST} assets={ASSETS} onClose={() => undefined} />);
  assert.match(html, /^<dialog class="sr-lembar sr-lembar-checklist" data-lembar="v_daftar" aria-labelledby="([^"]+)">[\s\S]*<span class="sr-lembar-jenis">Daftar periksa<\/span><h2 id="\1">Daftar berkas paket<\/h2>/);
  assert.match(html, /<button type="button" class="sr-lembar-tutup"><span aria-hidden="true">✕<\/span> Tutup<\/button>/);
  assert.match(html, /Foto kardus[\s\S]*✓<\/span> Ada[\s\S]*Resi<span class="sr-periksa-nilai">Nomor buram<\/span>[\s\S]*\?<\/span> Perlu dicek/);
  assert.equal(count(html, 'sr-tanda sr-tanda-'), 2, 'a row without a mark shows no word');
  const doc = renderToStaticMarkup(<EvidenceSheet item={DOC} assets={ASSETS} onClose={() => undefined} />);
  assert.match(doc, /<span class="sr-lembar-jenis">Surat<\/span>/, 'the author own label replaces the kind word');
  assert.match(doc, /<p class="sr-berkas-teks">Baris satu\.\nBaris dua\.<\/p>/);
  assert.doesNotMatch(doc, /sr-periksa/);
});

test('EvidenceSheet: its own live region starts empty, so opening a sheet never repeats an earlier announcement', () => {
  const html = renderToStaticMarkup(
    <AnnouncementContext.Provider value={{ seq: 2, text: 'Pilihan dibuka.' }}>
      <EvidenceSheet item={DOC} assets={ASSETS} onClose={() => undefined} />
    </AnnouncementContext.Provider>,
  );
  assert.match(html, /<p class="sr-only" role="status"><\/p><\/div><\/dialog>$/);
});

test('EvidenceSheet: a picture without a file leaves a note and the text; nothing while its asset is not listed yet', () => {
  const notListed = renderToStaticMarkup(<EvidenceSheet item={PHOTO} assets={ASSETS} onClose={() => undefined} />);
  assert.doesNotMatch(notListed, /Gambar tidak dapat dimuat|<img/, 'the list may still be the previous round one');
  assert.match(notListed, /Label tertulis rapuh\./);
  assert.doesNotMatch(renderToStaticMarkup(<EvidenceSheet item={PHOTO} assets={null} onClose={() => undefined} />), /Gambar tidak dapat dimuat/);
  const photo = (over: Partial<RoomAsset>) => new Map([...ASSETS, ['asset:foto-label', { ...ASSETS.get('asset:latar-gudang')!, id: 'asset:foto-label', kind: 'photo', ...over }]]);
  assert.match(renderToStaticMarkup(<EvidenceSheet item={PHOTO} assets={photo({ builtin: true, url: null })} onClose={() => undefined} />), /Gambar tidak dapat dimuat\.[\s\S]*Label tertulis rapuh\./);
  assert.match(renderToStaticMarkup(<EvidenceSheet item={PHOTO} assets={photo({ url: '/aset/label.png' })} onClose={() => undefined} />), /<img class="sr-berkas-gambar" src="\/aset\/label\.png" alt="Foto label"/);
});

test('PictureSheet: the field scene picture across the sheet, titled by the round, with the same close button', () => {
  const html = withoutPreload(renderToStaticMarkup(<PictureSheet url="/aset/latar.png" title="Paket tertahan di gudang" onClose={() => undefined} />));
  assert.match(html, /^<dialog class="sr-lembar sr-lembar-gambar" data-lembar-gambar="" aria-labelledby="([^"]+)">[\s\S]*<span class="sr-lembar-jenis">Gambar adegan<\/span><h2 id="\1">Paket tertahan di gudang<\/h2>/);
  assert.match(html, /<div class="sr-lembar-isi"><div class="sr-lembar-gambar-geser"><img class="sr-lembar-gambar-isi" src="\/aset\/latar\.png" alt=""[^>]*><\/div><p class="sr-lembar-gambar-petunjuk">Geser gambar ke samping untuk melihat bagian lainnya\.<\/p>/, 'a frame that pans on a phone, with its hint');
  assert.match(html, /class="sr-lembar-tutup"/);
  assert.doesNotMatch(html, /data-lembar=/, 'not an evidence item');
});

test('EvidenceList: chips, desk cards and a numbered list open the same items (data-berkas); shared screens show contents', () => {
  const open = () => undefined;
  const chips = renderToStaticMarkup(<EvidenceList items={[CHECKLIST, PHOTO]} variant="chips" onOpen={open} assets={null} />);
  assert.match(chips, /<ul class="sr-lampiran" aria-label="Bahan untukmu">/, 'the officer own material, not something the contact sent');
  assert.deepEqual(
    [...chips.matchAll(/data-berkas="([^"]+)"/g)].map((m) => m[1]),
    ['v_daftar', 'v_foto'],
  );
  const cards = renderToStaticMarkup(<EvidenceList items={[CHECKLIST, DOC]} variant="cards" onOpen={open} assets={null} />);
  assert.match(cards, /Daftar periksa<\/span><span class="sr-berkas-judul">Daftar berkas paket<\/span><span class="sr-berkas-ringkas">3 butir/);
  assert.match(cards, /<span class="sr-berkas-jenis">Surat<\/span><span class="sr-berkas-judul">Surat gudang<\/span><\/span>/, 'the author own label; a document card has no preview line');
  const list = renderToStaticMarkup(<EvidenceList items={[CHECKLIST, PHOTO, DOC]} variant="list" onOpen={open} assets={null} />);
  assert.match(list, /<ol class="sr-titik" aria-label="Titik informasi">/);
  assert.deepEqual(
    [...list.matchAll(/sr-titik-no" aria-hidden="true">(\d)/g)].map((m) => m[1]),
    ['1', '2', '3'],
  );
  assert.deepEqual(
    [...list.matchAll(/<span class="sr-titik-jenis">([^<]+)<\/span>/g)].map((m) => m[1]),
    ['Daftar periksa', 'Foto', 'Surat'],
  );
  const shared = renderToStaticMarkup(<EvidenceList items={[CHECKLIST, DOC]} variant="chips" onOpen={null} assets={null} />);
  assert.doesNotMatch(shared, /<button|data-berkas/);
  assert.match(shared, /Daftar berkas paket[\s\S]*Foto kardus[\s\S]*<h3>Surat gudang<\/h3><span class="sr-berkas-jenis">Surat<\/span>/);
});

function surface(layout: RoundLayout, opts: { mode?: RoundViewMode; phase?: StoryPhase; view?: Partial<RoundView>; scene?: Partial<StoryScenePublic>; decision?: ReactNode } = {}): string {
  const v = { ...roundViewOf({ scene: scene(layout, opts.scene), assets: ASSETS }), ...opts.view };
  return withoutPreload(renderToStaticMarkup(<RoundSurface view={v} mode={opts.mode ?? 'participant'} phase={opts.phase ?? 'answering'} decision={opts.decision ?? <p>SLOT</p>} renderStage={() => <p>STAGE</p>} />));
}

test('RoundSurface: the activity follows the content layout (data-aktivitas); the legacy stage is injected', () => {
  for (const layout of ['chat', 'dossier', 'field'] as const) assert.match(surface(layout), new RegExp(`^<section class="sr-aktivitas sr-aktivitas-${layout} sr-mode-participant sr-tahap-answering" data-aktivitas="${layout}">`));
  assert.match(surface('stage'), /data-aktivitas="stage"><p>STAGE<\/p>/);
});

test('chat activity: one thread (no picture beside it), contact from the respondent, attachments, question and the slot in the composer', () => {
  const html = surface('chat');
  assert.doesNotMatch(html, /<img/, 'no illustration of a chat next to the chat');
  assert.match(html, /<span class="sr-chat-kontak"><b>Pak Joko<\/b>/);
  assert.match(html, /<div class="sr-chat-lampiran"><span class="sr-chat-lampiran-label" aria-hidden="true">Bahan untukmu<\/span>[\s\S]*data-berkas="v_daftar"[\s\S]*data-berkas="v_foto"[\s\S]*data-berkas="v_surat"/);
  assert.match(html, /<div class="sr-chat-komposer"><div class="sr-area-keputusan"><h2 class="sr-tugas">Apa langkahmu sekarang\?<\/h2><p>SLOT<\/p><\/div><\/div>/);
  assert.match(html, /<ol class="sr-chat-isi" aria-live="off">/, 'not live while answering');
  assert.match(surface('chat', { phase: 'scene' }), /<ol class="sr-chat-isi" aria-live="polite">/, 'live while messages arrive');
  const narration = surface('chat', { scene: { respondent: null, lines: [line('l1', 0, 'narrator', null, 'Berkas disiapkan.')] } });
  assert.match(narration, /sr-chat-avatar sr-chat-avatar-ikon[\s\S]*<b>Paket tertahan di gudang<\/b>/, 'no invented contact');
});

test('chat consequence: the participant own conditional line stays in the thread, in authored order, above the outcome', () => {
  const own = line('lf1', 0.5, 'customer', 'Pak Joko', 'Bagaimana dengan janji kemarin?');
  const view = roundViewOf({ scene: scene('chat'), flagLines: [own], outcome: outcome(), assets: ASSETS });
  const decision = <OutcomeBlock outcome={outcome()} layout="chat" officerName={null} moodLabels={null} />;
  const html = renderToStaticMarkup(<RoundSurface view={view} mode="participant" phase="consequence" decision={decision} renderStage={() => null} />);
  assert.match(html, /Pesan masuk pagi ini\.[\s\S]*Bagaimana dengan janji kemarin\?[\s\S]*Paket saya belum sampai\.[\s\S]*<div class="sr-chat-lanjutan">[\s\S]*data-hasil=""/);
  assert.equal(count(html, 'Bagaimana dengan janji kemarin?'), 1);
});

test('desk and field activities: document cards; a numbered list equal to the scene markers; picture decorative', () => {
  const desk = surface('dossier');
  assert.match(desk, /<div class="sr-meja"><ul class="sr-berkas-daftar"/);
  assert.equal(count(desk, 'data-berkas='), 3);
  const field = surface('field');
  assert.match(field, /<figure class="sr-lapangan"><div class="sr-lapangan-bingkai"><img src="\/aset\/latar\.png" alt=""\/>/);
  assert.match(field, /<figcaption class="sr-lapangan-keterangan"><span class="sr-kecil sr-lapangan-petunjuk">Ketuk nomor di gambar atau di daftar/);
  assert.match(field, /<ol class="sr-titik"/);
  assert.equal(count(field, 'class="sr-penanda"'), 0, 'markers wait for the picture to have its size');
  assert.doesNotMatch(field, /Perbesar gambar/, 'and so does the zoom button');
  const noPicture = surface('field', { scene: { backgroundAssetId: 'builtin:bg:parkiran' } });
  assert.doesNotMatch(noPicture, /sr-lapangan"/);
  assert.match(noPicture, /<ol class="sr-titik"/, 'the list alone carries every point');
});

test('private parts: reminders only on a participant device; the public lesson only after close and without a private outcome', () => {
  const reminders = [{ label: 'Janji kirim sore', fromRound: 1, delta: -12 }];
  const mine = surface('chat', { view: { reminders } });
  assert.match(mine, /data-pengingat=""[\s\S]*Pengingat:<\/b> Janji kirim sore \(babak 1\) berdampak di babak ini: status −12\./);
  // The same reminder in one line under the question, so it is on screen when the options open (no second hook).
  assert.match(mine, /<h2 class="sr-tugas">Apa langkahmu sekarang\?<\/h2><p class="sr-tugas-pengingat">[\s\S]*?<span class="sr-tugas-pengingat-teks"><b>Pengingat:<\/b> status −12 karena Janji kirim sore \(babak 1\)<\/span><\/p><p>SLOT/);
  assert.equal(count(mine, 'data-pengingat'), 1);
  assert.doesNotMatch(surface('chat', { mode: 'projector', view: { reminders } }), /data-pengingat|sr-tugas-pengingat/);
  const lesson = { lesson: 'Kabari hari ini.' };
  assert.match(surface('dossier', { mode: 'projector', phase: 'consequence', scene: lesson }), /sr-pelajaran sr-pelajaran-umum"><b>Pelajaran<\/b><p>Kabari hari ini\./);
  assert.doesNotMatch(surface('dossier', { phase: 'consequence', scene: lesson, view: { outcome: outcome() } }), /sr-pelajaran-umum/, 'the private outcome shows the lesson');
});

test('projector mode: no decision slot, the question while playing, evidence contents inline instead of openers', () => {
  const html = surface('chat', { mode: 'projector' });
  assert.doesNotMatch(html, /SLOT|data-berkas|role="radio"/);
  assert.match(html, /<h2 class="sr-tugas">Apa langkahmu sekarang\?<\/h2>/);
  assert.match(html, /sr-berkas-tampil[\s\S]*Daftar berkas paket[\s\S]*Perlu dicek/);
  assert.doesNotMatch(surface('chat', { mode: 'projector', phase: 'consequence' }), /sr-tugas/);
});

test('RoundHeader: Babak n/15 · meta · key badge (with its meaning), the title, the task, and one status chip', () => {
  const html = renderToStaticMarkup(<RoundHeader scene={scene('chat')} totalRounds={15} mood={{ label: 'Bimbang', band: 'ragu', changedFrom: 'Lega', delayedDelta: -12 }} customerName="Pak Joko" task="Apa langkahmu sekarang?" />);
  const meaning = 'Keputusan penting bagi akhir cerita; nilainya sama\\.';
  assert.match(html, new RegExp(`Babak 3/15</span><span class="sr-ronde-meta">Laporan · Hari ke-2</span><span class="sr-tanda-kunci" title="${meaning}"><span aria-hidden="true">★</span> Babak kunci<span class="sr-only">: ${meaning}</span></span>`));
  assert.match(html, /<h1 class="sr-ronde-judul">Paket tertahan di gudang<\/h1><p class="sr-ronde-tugas"><b>Tugas:<\/b> Apa langkahmu sekarang\?<\/p>/);
  assert.equal(count(html, 'data-suasana'), 1);
  assert.match(
    html,
    /Status Pak Joko:<\/span><b class="sr-suasana-kata">Lega <span aria-hidden="true">→<\/span><span class="sr-only"> menjadi<\/span> Bimbang<\/b><span class="sr-suasana-dampak"><span aria-hidden="true">· <\/span><span class="sr-only">dampak tertunda <\/span>−12<\/span>/,
  );
  // An effect that leaves the band unchanged is still shown in the chip ("Senang · −12").
  const sameBand = renderToStaticMarkup(<RoundHeader scene={scene('chat')} totalRounds={15} mood={{ label: 'Senang', band: 'senang', delayedDelta: -12 }} customerName="Pak Joko" />);
  assert.match(sameBand, /<b class="sr-suasana-kata">Senang<\/b><span class="sr-suasana-dampak">[\s\S]*−12<\/span>/);
  const plain = renderToStaticMarkup(<RoundHeader scene={scene('chat', { meta: '', keyRound: false })} totalRounds={15} mood={{ label: 'Bimbang', band: 'ragu' }} customerName="Pak Joko" level={2} />);
  assert.doesNotMatch(plain, /sr-tanda-kunci|sr-ronde-meta|sr-ronde-tugas|sr-suasana-dampak/);
  assert.match(plain, /<h2 class="sr-ronde-judul">/);
  assert.doesNotMatch(renderToStaticMarkup(<RoundHeader scene={scene('chat')} totalRounds={15} mood={null} customerName="Pak Joko" />), /data-suasana/);
});
