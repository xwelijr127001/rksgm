import type { ContentIssue } from '@shared/story/validate';

/**
 * All validation results (the same validator the server runs before review/publication). Clicking an issue jumps
 * to the tab/round that holds the field.
 */
export function IssuesTab({ issues, onJump }: { issues: ContentIssue[]; onJump: (issue: ContentIssue) => void }) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  if (issues.length === 0) return <p className="stf-ok">Tidak ada masalah. Skenario siap diajukan ke review.</p>;
  return (
    <div className="cms-tab-isi">
      <p className={errors.length ? 'stf-galat' : 'stf-peringatan'}>
        {errors.length} galat (wajib diperbaiki sebelum diajukan/terbit) · {warnings.length} peringatan (periksa, terutama anonimisasi).
      </p>
      <ul className="cms-isu-semua">
        {[...errors, ...warnings].map((i, k) => (
          <li key={k}>
            <button type="button" className={i.severity === 'error' ? 'cms-isu-galat' : 'cms-isu-peringatan'} onClick={() => onJump(i)}>
              {i.round ? `Babak ${i.round}: ` : ''}
              {i.message.replace(/^Babak \d+: /, '')}
              <small className="mono"> {i.field}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
