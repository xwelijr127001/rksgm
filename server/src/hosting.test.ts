/** Hosting configuration (docs/prd-v02/HOSTING.md): framing policy parsing must never allow header injection. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { frameAncestorsFrom } from './config';
import { clientIp } from './story/auth/clientIp';

test("frame-ancestors: default and invalid input fall back to 'self'", () => {
  assert.equal(frameAncestorsFrom(undefined), "'self'");
  assert.equal(frameAncestorsFrom(''), "'self'");
  assert.equal(frameAncestorsFrom('javascript:alert(1)'), "'self'");
});

test('frame-ancestors: valid sources are kept, injection attempts are dropped', () => {
  assert.equal(frameAncestorsFrom("'self' https://raksaonline.com"), "'self' https://raksaonline.com");
  assert.equal(frameAncestorsFrom('http://127.0.0.1:4890 https://*.raksaonline.com'), 'http://127.0.0.1:4890 https://*.raksaonline.com');
  assert.equal(frameAncestorsFrom('https://evil.com; script-src *'), "'self'", 'a token carrying ";" is rejected, so no extra directive can be injected');
  assert.equal(frameAncestorsFrom("https://ok.example 'unsafe-inline'"), 'https://ok.example');
});

test('client IP behind trusted proxies follows Express trust-proxy hop semantics; untrusted headers are ignored', () => {
  assert.equal(clientIp('10.0.0.5', '203.0.113.9', 0), '10.0.0.5', 'without trusted hops X-Forwarded-For is ignored (forgeable)');
  assert.equal(clientIp('127.0.0.1', '203.0.113.9', 1), '203.0.113.9', 'one proxy: the address the proxy saw');
  assert.equal(clientIp('127.0.0.1', '1.1.1.1, 203.0.113.9', 1), '203.0.113.9', 'a client-supplied left entry cannot spoof');
  assert.equal(clientIp('127.0.0.1', '1.1.1.1, 198.51.100.7', 2), '1.1.1.1');
  assert.equal(clientIp('127.0.0.1', undefined, 1), '127.0.0.1');
});
