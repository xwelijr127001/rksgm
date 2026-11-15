/**
 * Participant display-name rules (PRD FR-B4, staff review #19). The SAME function runs on the server (authoritative,
 * on join and on rename) and in the client (instant feedback). The word filter is a deterrent, not a guarantee: the
 * host can still remove a participant (PRD risk table "Nama peserta tidak pantas").
 */

export const NAME_MIN_CHARS = 2;
export const NAME_MAX_CHARS = 20;

export type NameRejection = 'empty' | 'too_short' | 'too_long' | 'invalid_chars' | 'needs_letter' | 'inappropriate' | 'duplicate';

export type NameCheck = { ok: true; name: string; key: string } | { ok: false; reason: NameRejection };

/** Indonesian user-facing message per rejection (server replies carry the code too, so clients can translate). */
export const NAME_REJECTION_MESSAGE: Record<NameRejection, string> = {
  empty: 'Nama wajib diisi.',
  too_short: `Nama minimal ${NAME_MIN_CHARS} karakter.`,
  too_long: `Nama maksimal ${NAME_MAX_CHARS} karakter.`,
  invalid_chars: 'Gunakan huruf, angka, spasi, titik, tanda petik, atau tanda hubung saja.',
  needs_letter: 'Nama harus memuat setidaknya satu huruf.',
  inappropriate: 'Nama ini tidak bisa dipakai. Pilih nama lain yang sopan.',
  duplicate: 'Nama ini sudah dipakai peserta lain di room ini. Tambahkan inisial atau nama lain.',
};

// Words blocked anywhere inside the compacted name (long enough to avoid false positives in real names).
const BLOCKED_ANYWHERE = [
  'anjing', 'anjeng', 'bangsat', 'kontol', 'memek', 'ngentot', 'entot', 'jancok', 'jancuk', 'goblok', 'goblog',
  'kampret', 'keparat', 'bajingan', 'pantek', 'pepek', 'peler', 'lonte', 'sundal', 'brengsek', 'bangke', 'tolol',
  'fuck', 'bitch', 'asshole', 'pussy', 'cunt', 'bastard', 'nigger', 'nigga', 'retard', 'whore', 'porn',
  'bokep', 'colmek',
];
// Short words blocked only as whole tokens (so "Asumi", "Taiwan", "Babinsa", "Dicky", "Colin", "Mashita" stay allowed).
const BLOCKED_TOKENS = ['asu', 'tai', 'tahi', 'babi', 'cuk', 'puki', 'bego', 'idiot', 'monyet', 'perek', 'dick', 'sex', 'slut', 'jembut', 'coli', 'shit'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i' };

/** Collapse spaces and strip control/format characters; NFKC so look-alike full-width forms become plain text. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let out = '';
  for (const ch of raw.normalize('NFKC')) {
    // Cc (control) and Cf (format, e.g. zero-width / bidi overrides) never belong in a public name.
    if (/[\p{Cc}\p{Cf}]/u.test(ch)) continue;
    out += ch;
  }
  return out.replace(/\s+/gu, ' ').trim();
}

/** Comparison key: case-folded, accents removed, spacing/punctuation ignored ("Budi S." == "budi s"). */
export function nameKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('id')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function inappropriate(name: string): boolean {
  const folded = name.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('id');
  const unleet = [...folded].map((c) => LEET[c] ?? c).join('');
  const compact = unleet.replace(/[^\p{L}]/gu, '');
  if (BLOCKED_ANYWHERE.some((w) => compact.includes(w))) return true;
  const tokens = unleet.split(/[^\p{L}]+/u).filter(Boolean);
  return tokens.some((t) => BLOCKED_TOKENS.includes(t));
}

/**
 * Validate a display name. `takenKeys` = nameKey() of names already used by OTHER participants of the same room.
 * Allowed: letters (any script), combining marks, digits, spaces, and . ' - _ .
 */
/** Raw input longer than this is rejected before any normalization work (bounded cost per request). */
const NAME_RAW_LIMIT = 200;

export function checkName(raw: unknown, takenKeys: ReadonlySet<string> = new Set()): NameCheck {
  if (typeof raw === 'string' && raw.length > NAME_RAW_LIMIT) return { ok: false, reason: 'too_long' };
  const name = cleanName(raw);
  if (name.length === 0) return { ok: false, reason: 'empty' };
  const chars = [...name].length;
  if (chars < NAME_MIN_CHARS) return { ok: false, reason: 'too_short' };
  if (chars > NAME_MAX_CHARS) return { ok: false, reason: 'too_long' };
  if (!/^[\p{L}\p{M}\p{N} .'_-]+$/u.test(name)) return { ok: false, reason: 'invalid_chars' };
  if (!/\p{L}/u.test(name)) return { ok: false, reason: 'needs_letter' };
  if (inappropriate(name)) return { ok: false, reason: 'inappropriate' };
  const key = nameKey(name);
  if (takenKeys.has(key)) return { ok: false, reason: 'duplicate' };
  return { ok: true, name, key };
}
