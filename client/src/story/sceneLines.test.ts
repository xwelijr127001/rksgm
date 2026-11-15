import assert from 'node:assert/strict';
import test from 'node:test';
import type { StorySceneLine } from '../../../shared/story/protocol';
import { initialsOf, revealedCount, revealStepMs, sceneConversation, splitReveal } from './sceneLines';

// Synthetic scene (a delayed parcel); no settled-case text.
const line = (id: string, pos: number, speaker: StorySceneLine['speaker'] = 'customer', name: string | null = 'Pak Joko', text = `Teks ${id}`): StorySceneLine => ({
  id,
  speaker,
  name,
  pos,
  text,
});

test('sceneConversation: public lines merged with own conditional lines in authored order', () => {
  const scene = { intro: [], lines: [line('l2', 1), line('l3', 2, 'narrator', null), line('l5', 4, 'cast', 'Kak Lia')] };
  const flagLines = [line('lf1', 0), line('lf4', 3, 'cast', 'Kak Lia')];
  const c = sceneConversation(scene, flagLines);
  assert.deepEqual(
    c.lines.map((l) => l.key),
    ['line:lf1', 'line:l2', 'line:l3', 'line:lf4', 'line:l5'],
  );
  assert.deepEqual(c.lines[3], { key: 'line:lf4', speaker: 'cast', name: 'Kak Lia', text: 'Teks lf4' });
  assert.equal(c.lines[2]!.name, null, 'narration keeps no name');
});

test('sceneConversation: shared screens (no flag lines) show the public lines only, untouched', () => {
  const scene = { intro: [], lines: [line('l2', 1), line('l3', 2)] };
  const c = sceneConversation(scene);
  assert.deepEqual(
    c.lines.map((l) => [l.key, l.text]),
    [
      ['line:l2', 'Teks l2'],
      ['line:l3', 'Teks l3'],
    ],
  );
  assert.equal(scene.lines.length, 2, 'input not mutated');
});

test('sceneConversation: opening lines keep their order and never collide with round line keys', () => {
  const scene = { intro: [line('l1', 0, 'officer', 'Mentor Uji'), line('l2', 1, 'officer', 'Mentor Uji')], lines: [line('l1', 0)] };
  const c = sceneConversation(scene);
  assert.deepEqual(
    c.intro.map((l) => l.key),
    ['intro:l1', 'intro:l2'],
  );
  assert.deepEqual(
    c.lines.map((l) => l.key),
    ['line:l1'],
  );
});

test('revealStepMs: messages arrive briskly — 30% of the reading time per line, bounded to 0.6–1.5 s; 1.2 s without a duration', () => {
  assert.equal(revealStepMs(null, 4), 1200);
  assert.equal(revealStepMs(0, 4), 1200);
  assert.equal(revealStepMs(20_000, 5), 1200);
  assert.equal(revealStepMs(60_000, 2), 1500);
  assert.equal(revealStepMs(5_000, 10), 600);
  assert.equal(revealStepMs(4_000, 0), 1200, 'no lines: treated as one');
  // The whole conversation of a typical round (5 lines, 20 s reading) is shown after 4.8 s.
  assert.equal(4 * revealStepMs(20_000, 5), 4_800);
});

test('revealedCount: first line at once, then one per step, never more than the total', () => {
  assert.equal(revealedCount(5, 0, 1000), 1);
  assert.equal(revealedCount(5, 999, 1000), 1);
  assert.equal(revealedCount(5, 1000, 1000), 2);
  assert.equal(revealedCount(5, 60_000, 1000), 5);
  assert.equal(revealedCount(5, -3000, 1000), 1, 'device clock slightly ahead of the scene start');
  assert.equal(revealedCount(0, 5000, 1000), 0);
});

test('splitReveal: opening lines are revealed before the round lines', () => {
  const intro = ['a', 'b'];
  const lines = ['c', 'd', 'e'];
  assert.deepEqual(splitReveal(intro, lines, 0), { intro: [], lines: [] });
  assert.deepEqual(splitReveal(intro, lines, -1), { intro: [], lines: [] });
  assert.deepEqual(splitReveal(intro, lines, 1), { intro: ['a'], lines: [] });
  assert.deepEqual(splitReveal(intro, lines, 2), { intro: ['a', 'b'], lines: [] });
  assert.deepEqual(splitReveal(intro, lines, 3), { intro: ['a', 'b'], lines: ['c'] });
  assert.deepEqual(splitReveal(intro, lines, 99), { intro: ['a', 'b'], lines: ['c', 'd', 'e'] });
  assert.deepEqual(splitReveal([], lines, 2), { intro: [], lines: ['c', 'd'] });
});

test('reveal over a merged scene: a flag holder reads one more line, in its authored place', () => {
  const scene = { intro: [line('i1', 0, 'officer', 'Mentor Uji')], lines: [line('l2', 1)] };
  const holder = sceneConversation(scene, [line('lf1', 0)]);
  const other = sceneConversation(scene);
  const total = (c: typeof holder) => c.intro.length + c.lines.length;
  assert.equal(total(holder), 3);
  assert.equal(total(other), 2);
  // Second step: the opening line, then the conditional line (pos 0) before the public line.
  assert.deepEqual(
    splitReveal(holder.intro, holder.lines, revealedCount(total(holder), 1000, 1000)).lines.map((l) => l.key),
    ['line:lf1'],
  );
  assert.deepEqual(
    splitReveal(other.intro, other.lines, revealedCount(total(other), 1000, 1000)).lines.map((l) => l.key),
    ['line:l2'],
  );
});

test('initialsOf: up to two initials for the chat avatar', () => {
  assert.equal(initialsOf('Pak Joko'), 'PJ');
  assert.equal(initialsOf('Teknisi Gudang Utara'), 'TG');
  assert.equal(initialsOf('  dewi  '), 'D');
  assert.equal(initialsOf('élan vital'), 'ÉV');
  assert.equal(initialsOf(''), '');
});
