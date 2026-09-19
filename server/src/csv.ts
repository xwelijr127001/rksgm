/**
 * Ekspor hasil pertandingan ke CSV (UTF-8 + BOM agar rapi di Excel).
 * Kolom ronde mengikuti PLAYLIST room (jumlah soal bisa selain 10).
 */

import type { Room } from './rooms';

function cell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function buildResultsCsv(room: Room): string {
  const roundIdx: number[] = [];
  const penentuan = room.tiebreakRound;
  for (let i = 0; i < room.totalRounds; i++) roundIdx.push(i);
  if (room.tiebreakUsed) roundIdx.push(penentuan);

  const header = [
    'kode_room',
    'nama_acara',
    'peringkat',
    'nama_panggilan',
    'total_poin',
    'total_ketepatan',
    'total_waktu_detik',
    'jawaban_terkirim',
    'lencana',
    'hadiah',
  ];
  for (const i of roundIdx) {
    const label = i === penentuan ? 'penentuan' : `misi${i + 1}`;
    header.push(`${label}_poin`, `${label}_ketepatan`, `${label}_detik`, `${label}_terjawab`);
  }

  const board = room.podium ?? room.leaderboard ?? [];
  const ordered = [...room.players.values()].sort((a, b) => {
    const ra = board.find((r) => r.playerId === a.id)?.rank ?? 9999;
    const rb = board.find((r) => r.playerId === b.id)?.rank ?? 9999;
    return ra - rb || b.totalPoints - a.totalPoints;
  });

  const lines = [header.map(cell).join(',')];
  for (const p of ordered) {
    const row = board.find((r) => r.playerId === p.id);
    const rank = row?.rank ?? 0;
    const prize =
      rank === 1 ? room.settings.prizes.first
      : rank === 2 ? room.settings.prizes.second
      : rank === 3 ? room.settings.prizes.third
      : '';
    const cells: unknown[] = [
      room.code,
      room.settings.eventName,
      rank || '',
      p.nickname,
      p.totalPoints,
      (Math.round(p.totalAccuracy * 1000) / 1000).toFixed(3),
      (p.totalTimeMs / 1000).toFixed(1),
      p.rounds.filter((r) => r.answered).length,
      room.lencana(p, rank).map((b) => b.label).join(' | '),
      prize,
    ];
    for (const i of roundIdx) {
      const r = p.rounds.find((x) => x.roundIndex === i);
      cells.push(
        r ? r.roundScore : '',
        r ? (Math.round(r.accuracy * 1000) / 1000).toFixed(3) : '',
        r ? (r.elapsedMs / 1000).toFixed(1) : '',
        r ? (r.answered ? 'ya' : 'tidak') : '',
      );
    }
    lines.push(cells.map(cell).join(','));
  }

  // Baris keterangan misi di bawah tabel utama (komentar, diawali #).
  lines.push('');
  lines.push(cell('# keterangan misi') + ',' + cell('judul') + ',' + cell('produk') + ',' + cell('detik'));
  for (const i of roundIdx) {
    const m = room.missionForRound(i);
    if (!m) continue;
    lines.push(
      [`# misi ${i === penentuan ? 'penentuan' : i + 1}`, m.title, m.productLabel, m.durationSeconds]
        .map(cell)
        .join(','),
    );
  }

  return '﻿' + lines.join('\r\n') + '\r\n';
}
