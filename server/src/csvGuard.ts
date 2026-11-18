/**
 * Spreadsheet formula injection guard (T-038), shared by the legacy export (csv.ts) and the Story report
 * (story/reports.ts). A cell is prefixed with an apostrophe when it starts with = + - @ (ASCII or full-width), or with
 * any whitespace or control character (TAB, CR, LF, NUL.., NBSP, ideographic space, BOM): spreadsheets trim or ignore
 * those and would then see a formula behind them. Cells with a quote, comma, semicolon (European separator) or line
 * break are quoted.
 */
const BERBAHAYA = /^[=+\-@＝＋－＠\s\u0000-\u001F\u007F-\u009F﻿]/;

export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (BERBAHAYA.test(s)) s = "'" + s;
  return /[",;\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
