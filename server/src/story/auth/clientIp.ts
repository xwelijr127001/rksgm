/**
 * Client address for rate limiting, with the same semantics as Express `trust proxy = <hops>`: with N trusted proxy
 * hops in front of the server, the client is the address N positions from the end of `X-Forwarded-For` + the socket
 * address. With 0 hops the header is ignored (it can be forged by anyone). Socket.IO handshakes do not go through
 * Express, so the socket layer uses this; HTTP routes use `req.ip` with `app.set('trust proxy', hops)`.
 */
export function clientIp(remoteAddress: string | undefined, forwardedFor: string | string[] | undefined, trustedHops: number): string {
  const remote = remoteAddress || 'unknown';
  if (trustedHops <= 0 || !forwardedFor) return remote;
  const header = Array.isArray(forwardedFor) ? forwardedFor.join(',') : forwardedFor;
  const chain = [
    ...header
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    remote,
  ];
  return chain[Math.max(0, chain.length - 1 - trustedHops)] ?? remote;
}
