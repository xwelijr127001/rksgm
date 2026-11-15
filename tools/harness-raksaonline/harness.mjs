/**
 * LOCAL HOSTING HARNESS — a stand-in parent site for the raksaonline.com integration questions (docs/prd-v02/HOSTING.md).
 * It is NOT raksaonline.com and does not imitate its branding; it only reproduces the two technical shapes IT may choose:
 *
 *   1. Path mount behind a reverse proxy:  http://127.0.0.1:<port>/game/*  ->  game server (prefix stripped),
 *      including WebSocket upgrades for /game/socket.io/ (Socket.IO).
 *   2. Embedding: the parent page at  http://127.0.0.1:<port>/  shows the game in an <iframe src="/game/"> and as a link.
 *
 * Usage (game client built with VITE_BASE_PATH=/game/ VITE_OUT_DIR=dist-game, game server started with
 * CLIENT_DIST=client/dist-game PUBLIC_BASE_URL=http://127.0.0.1:4890/game FRAME_ANCESTORS=http://127.0.0.1:4890):
 *   GAME_ORIGIN=http://127.0.0.1:4830 HARNESS_PORT=4890 node tools/harness-raksaonline/harness.mjs
 * No dependencies beyond Node's standard library.
 */
import http from 'node:http';
import net from 'node:net';

const GAME = new URL(process.env.GAME_ORIGIN || 'http://127.0.0.1:4830');
const PORT = Number(process.env.HARNESS_PORT || 4890);
const PREFIX = '/game';

const PARENT_PAGE = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Halaman induk simulasi (uji integrasi)</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #eceff3; color: #1f2933; }
  header { padding: 12px 16px; background: #fff; border-bottom: 1px solid #d5dae1; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  header b { font-size: 15px; }
  header small { color: #52606d; }
  main { padding: 12px; }
  iframe { width: 100%; height: calc(100vh - 110px); min-height: 560px; border: 1px solid #c3cad3; border-radius: 10px; background: #fff; }
</style></head>
<body>
  <header><b>Halaman induk SIMULASI</b><small>Pengganti lokal untuk uji teknis integrasi (bukan raksaonline.com).</small>
    <a href="${PREFIX}/" target="_top" id="tautan-game">Buka game di halaman penuh</a></header>
  <main><iframe id="bingkai-game" src="${PREFIX}/" title="Raksa Game" allow="autoplay"></iframe></main>
</body></html>`;

/** Append the address this proxy saw, like Apache/nginx do (the game server trusts one hop: TRUST_PROXY_HOPS=1). */
function forwardedFor(req) {
  const prior = req.headers['x-forwarded-for'];
  return (prior ? `${prior}, ` : '') + (req.socket.remoteAddress ?? '');
}

function strip(url) {
  const rest = url.slice(PREFIX.length);
  return rest.startsWith('/') ? rest : '/' + rest;
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(PARENT_PAGE);
    return;
  }
  if (url === PREFIX) {
    res.writeHead(301, { location: PREFIX + '/' });
    res.end();
    return;
  }
  if (!url.startsWith(PREFIX + '/')) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Tidak ada di halaman induk simulasi');
    return;
  }
  const upstream = http.request(
    { host: GAME.hostname, port: GAME.port, method: req.method, path: strip(url), headers: { ...req.headers, host: GAME.host, 'x-forwarded-prefix': PREFIX, 'x-forwarded-for': forwardedFor(req) } },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Game server tidak terjangkau');
  });
  req.pipe(upstream);
});

// WebSocket upgrade (Socket.IO): forward the raw upgrade request with the prefix stripped, then pipe both ways.
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '/';
  if (!url.startsWith(PREFIX + '/')) {
    socket.destroy();
    return;
  }
  const up = net.connect(Number(GAME.port), GAME.hostname, () => {
    const lines = [`${req.method} ${strip(url)} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i];
      if (name.toLowerCase() === 'x-forwarded-for') continue;
      lines.push(`${name}: ${name.toLowerCase() === 'host' ? GAME.host : req.rawHeaders[i + 1]}`);
    }
    lines.push(`X-Forwarded-For: ${forwardedFor(req)}`);
    up.write(lines.join('\r\n') + '\r\n\r\n');
    if (head?.length) up.write(head);
    up.pipe(socket);
    socket.pipe(up);
  });
  const close = () => {
    up.destroy();
    socket.destroy();
  };
  up.on('error', close);
  socket.on('error', close);
});

server.listen(PORT, '127.0.0.1', () => console.log(`Harness: http://127.0.0.1:${PORT}/  (game ${GAME.origin} di ${PREFIX}/)`));
