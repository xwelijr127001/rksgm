/** Transport real time: satu koneksi Socket.IO untuk seluruh aplikasi. */

import { io, type Socket } from 'socket.io-client';
import type { Ack } from '@shared/types';

const SERVER_URL = (import.meta.env.VITE_SERVER_URL as string | undefined) || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 400,
    reconnectionDelayMax: 3000,
    timeout: 8000,
  });
  return socket;
}

/** Emit + tunggu acknowledgement server. */
export function rpc<T = unknown>(event: string, payload: unknown, timeoutMs = 9000): Promise<Ack<T>> {
  const sock = getSocket();
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, error: 'Server tidak menjawab. Periksa koneksi.' });
    }, timeoutMs);
    sock.emit(event, payload, (res: Ack<T>) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(res ?? { ok: false, error: 'Jawaban server kosong' });
    });
  });
}
