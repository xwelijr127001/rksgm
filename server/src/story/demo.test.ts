/** The two SYNTHETIC demo scenarios must pass the same publication validation as any CMS scenario. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { CONTENT_SCHEMA_VERSION, STORY_CHOICE_COUNT, STORY_ROUND_COUNT } from '../../../shared/story/content';
import { playThrough } from '../../../shared/story/engine';
import { sanitizeScenarioContent, validateScenario } from '../../../shared/story/validate';
import { demoBanjirContent } from './seed/demoBanjir';
import { demoBaretContent } from './seed/demoBaret';
import { testValidationContext } from './testing/fixtures';

const ctx = testValidationContext();

for (const [name, build] of [['baret', demoBaretContent], ['banjir', demoBanjirContent]] as const) {
  test(`demo scenario "${name}": 15 rounds x 5 meaningful choices, publishable, labeled demo, best/poor paths reach different endings`, () => {
    const c = build();
    assert.equal(c.contentSource, 'demo');
    assert.ok(c.text.id!['scenario.title']!.startsWith('[DEMO]'));
    assert.equal(c.rounds.length, STORY_ROUND_COUNT);
    for (const r of c.rounds) assert.equal(r.choices.length, STORY_CHOICE_COUNT);
    const errors = validateScenario(c, ctx).filter((i) => i.severity === 'error');
    assert.deepEqual(errors, []);
    const best = playThrough(c, (round) => ({ choiceId: round.choices.find((x) => x.classification === 'tepat')!.id, elapsedMs: 8000 }));
    const poor = playThrough(c, (round) => ({ choiceId: round.choices.find((x) => x.classification === 'keliru')!.id, elapsedMs: 8000 }));
    const partial = playThrough(c, (round) => ({ choiceId: round.choices.find((x) => x.classification === 'kurang_tepat')!.id, elapsedMs: 15000 }));
    const idle = playThrough(c, () => ({ choiceId: null, elapsedMs: 0 }));
    assert.equal(best.ending.kind, 'happy');
    assert.equal(poor.ending.id, 'kecewa');
    assert.equal(partial.ending.kind, 'with_notes');
    assert.equal(idle.ending.id, 'kecewa');
  });

  test(`demo scenario "${name}": uses none of the optional features and reloads identically from stored JSON`, () => {
    const c = build();
    assert.equal(c.schemaVersion, CONTENT_SCHEMA_VERSION);
    assert.deepEqual([c.cast, c.intro, c.authorNotes], [[], [], '']);
    for (const r of c.rounds) {
      assert.deepEqual([r.layout, r.keyRound, r.flagEffects, r.authorNote, r.evidence, r.respondent], ['stage', false, [], '', [], null]);
      assert.ok(r.lines.every((l) => l.castId === null && l.ifFlag === null && l.speaker !== 'cast'));
      assert.ok(r.choices.every((x) => x.setsFlag === null));
    }
    assert.deepEqual(sanitizeScenarioContent(JSON.parse(JSON.stringify(c))), c);
    const run = playThrough(c, (round) => ({ choiceId: round.choices.find((x) => x.classification === 'tepat')!.id, elapsedMs: 8000 }));
    assert.ok(run.decisions.every((d) => d.delayedDelta === 0), 'no delayed consequences in demos');
  });
}
