/**
 * T-011 guard (D-76): the pre-JS loading screen in client/index.html (`<template id="pra-tpl">`) must stay a copy of the React
 * loader's markup (KerangkaPemuat), so the handover is pixel-identical. Any change to one without the other fails here.
 * Normalised only for serialisation differences (DOM outerHTML vs renderToStaticMarkup): the template's `id="pra-pemuat"`,
 * inline-style spacing / trailing ";", and `<i></i>` vs `<i/>`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { KerangkaPemuat } from './PemuatAwal';

const html = fs.readFileSync(path.resolve(import.meta.dirname, '../../index.html'), 'utf8');

const rapikan = (s: string) => s
  .replace(/ id="pra-pemuat"/, '')
  .replace(/style="([^"]*)"/g, (_, v: string) => `style="${v.replace(/\s+/g, '').replace(/;$/, '')}"`)
  .replace(/<i\s*\/>/g, '<i></i>');

test('pre-JS template in index.html equals the React loader markup', () => {
  const m = /<template id="pra-tpl">([\s\S]*?)<\/template>/.exec(html);
  assert.ok(m, 'index.html has <template id="pra-tpl">');
  const template = rapikan(m![1]!);
  const react = rapikan(renderToStaticMarkup(<KerangkaPemuat teks="Menyiapkan…" />));
  assert.equal(template, react);
});

test('pre-JS block is scoped to the homepage like the D-59 preload and exposes __lepasPra', () => {
  assert.match(html, /var b='%BASE_URL%',p=location\.pathname;if\(p!==b&&p\+'\/'!==b\)return;/);
  assert.match(html, /window\.__lepasPra=function\(f\)/);
  assert.ok(html.indexOf('<div id="root"></div>') < html.indexOf('<template id="pra-tpl">'), 'block after #root');
});
