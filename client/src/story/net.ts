/**
 * Socket.IO transport for the Story Room namespace (`/story`). Participants and projectors share one anonymous
 * connection; staff (host console) open their own connection carrying the staff session token, so a host page never
 * mixes its authority with an anonymous socket.
 */
import { io, type Socket } from 'socket.io-client';
import { STORY_NAMESPACE, type StoryAck } from '@shared/story/protocol';
import { SERVER_ORIGIN, SOCKET_PATH } from './base';

const OPTIONS = {
  path: SOCKET_PATH,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 400,
  reconnectionDelayMax: 3000,
  timeout: 8000,
};

let anonymous: Socket | null = null;

/** Shared anonymous `/story` connection (participant / projector). */
export function storySocket(): Socket {
  anonymous ??= io(SERVER_ORIGIN + STORY_NAMESPACE, OPTIONS);
  return anonymous;
}

/** A separate authenticated `/story` connection for the host console. Caller disconnects it on unmount/logout. */
export function staffSocket(staffToken: string): Socket {
  return io(SERVER_ORIGIN + STORY_NAMESPACE, { ...OPTIONS, forceNew: true, auth: { staffToken } });
}

const NO_ANSWER = 'Server tidak menjawab. Periksa koneksi lalu coba lagi.';

/** Emit and wait for the server acknowledgement; a missing/late ack becomes a typed failure, never a throw. */
export function storyRpc<T>(socket: Socket, event: string, payload: unknown, timeoutMs = 9000): Promise<StoryAck<T>> {
  return new Promise((resolve) => {
    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, code: 'invalid', error: NO_ANSWER });
    }, timeoutMs);
    socket.emit(event, payload, (res: StoryAck<T> | undefined) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(res ?? { ok: false, code: 'invalid', error: NO_ANSWER });
    });
  });
}
