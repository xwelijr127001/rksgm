import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Speaker } from '../../../../shared/story/content';
import { ChatHeader, ChatLine, Conversation, type ConversationLine } from './conversation';

// Synthetic lines (a delayed parcel); no settled-case text.
const L = (key: string, speaker: Speaker, name: string | null, text: string): ConversationLine => ({ key, speaker, name, text });
const lines = [
  L('a', 'narrator', null, 'Pesan baru masuk.'),
  L('b', 'customer', 'Pak Joko', 'Paket saya di mana?'),
  L('c', 'cast', 'Kak Lia', 'Saya cek gudang dulu.'),
  L('d', 'officer', 'Mentor Uji', 'Baik, ditunggu.'),
];
const thread = (contact: string | null) => renderToStaticMarkup(<ol>{lines.map((l) => <ChatLine key={l.key} line={l} contact={contact} />)}</ol>);
const count = (html: string, s: string) => html.split(s).length - 1;

test('chat lines: incoming and outgoing bubbles, narration as a centered note', () => {
  const html = thread('Pak Joko');
  assert.match(html, /<li class="sr-chat-catatan"><span>Pesan baru masuk\.<\/span><\/li>/);
  assert.equal(count(html, 'sr-chat-masuk'), 2);
  assert.equal(count(html, 'sr-chat-keluar'), 1);
  assert.equal(count(html, '<li'), 4, 'one list item per line');
});

test('chat lines: the sender is written on bubbles from someone other than the contact, read out on the others', () => {
  const html = thread('Pak Joko');
  assert.match(html, /<span class="sr-chat-pengirim">Kak Lia<\/span>/);
  assert.doesNotMatch(html, /sr-chat-pengirim">Pak Joko/, 'the contact is named in the header, not on each bubble');
  assert.match(html, /<span class="sr-only">Pak Joko: <\/span>/);
  assert.match(html, /<span class="sr-only">Mentor Uji: <\/span>/);
  const noContact = thread(null);
  assert.match(noContact, /<span class="sr-chat-pengirim">Pak Joko<\/span>/, 'without a person as contact every sender is written');
});

test('chat header: initials of a person, a chat icon when the header names the round instead', () => {
  const person = renderToStaticMarkup(<ChatHeader name="Pak Joko" />);
  assert.match(person, /<span class="sr-chat-avatar" aria-hidden="true">PJ<\/span><span class="sr-chat-kontak"><b>Pak Joko<\/b>/);
  const round = renderToStaticMarkup(<ChatHeader name="Berkas disiapkan" person={false} />);
  assert.match(round, /<span class="sr-chat-avatar sr-chat-avatar-ikon" aria-hidden="true"><svg/);
  assert.doesNotMatch(round, />BD</);
});

test('stage conversation: the dialogue list with speaker names (cast included), narration without a name', () => {
  const html = renderToStaticMarkup(<Conversation lines={lines} />);
  assert.doesNotMatch(html, /sr-chat/);
  assert.match(html, /<li class="sr-baris sr-baris-narrator"><span class="sr-baris-teks">Pesan baru masuk\.<\/span><\/li>/);
  assert.match(html, /<li class="sr-baris sr-baris-cast"><span class="sr-baris-siapa">Kak Lia<\/span>/);
  assert.match(html, /<li class="sr-baris sr-baris-officer"><span class="sr-baris-siapa">Mentor Uji<\/span>/);
});

test('opening lines come first under the "Pembuka" label', () => {
  const intro = [L('i1', 'officer', 'Mentor Uji', 'Selamat datang.'), L('i2', 'officer', 'Mentor Uji', 'Mari mulai.')];
  const html = renderToStaticMarkup(<Conversation lines={lines} intro={intro} />);
  const pembuka = html.indexOf('<span class="sr-pembuka-label">Pembuka</span>');
  assert.ok(pembuka >= 0);
  assert.ok(pembuka < html.indexOf('Selamat datang.') && html.indexOf('Mari mulai.') < html.indexOf('Pesan baru masuk.'), 'intro before the round lines');
  assert.doesNotMatch(renderToStaticMarkup(<Conversation lines={lines} />), /Pembuka/);
});

test('one polite live region while lines reveal', () => {
  assert.match(renderToStaticMarkup(<Conversation lines={lines} live />), /^<div class="sr-percakapan sr-percakapan-stage" aria-live="polite">/);
  assert.match(renderToStaticMarkup(<Conversation lines={lines} />), /^<div class="sr-percakapan sr-percakapan-stage" aria-live="off">/);
});
