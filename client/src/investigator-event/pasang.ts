/**
 * T-109: registers the event board entry on the hub (mount point of card 5). Imported once by App.tsx. The entry draws
 * nothing unless the server reports `features.investigatorAcara`; "Tamu baru" on the hub also ends the event session.
 */
import { pasangEntriAcara, saatTamuBaru } from '../cerita/investigasi/acara';
import { EntriAcara } from './EntriAcara';
import { catatPilihSendiri, simpanSesi } from './sesi';

pasangEntriAcara(EntriAcara);
saatTamuBaru(() => { simpanSesi(null); catatPilihSendiri(null); });
