/**
 * Renderer interaksi satu langkah misi (RAKSA GAME).
 *
 * Semua jenis langkah bisa diselesaikan dengan TAP saja. Kunci jawaban hanya
 * ditampilkan bila prop `reveal` berisi teks dari server (fase REVEAL).
 */

import { useState, type ReactElement } from 'react';
import { formatRupiah } from '@shared/scoring';
import type {
  AssignStep,
  MultiStep,
  NumberStep,
  OptionDef,
  OrderStep,
  SceneKey,
  SingleStep,
  StepAnswer,
  StepDef,
} from '@shared/types';
import { Icon } from '../art/Icon';
import { Scene } from '../art/Scene';
import { playSfx } from '../audio/audio';

export interface InteractionProps {
  step: StepDef;
  value: StepAnswer | undefined;
  onChange: (v: StepAnswer) => void;
  disabled?: boolean;
  /** Saat REVEAL: daftar teks jawaban benar dari server. */
  reveal?: string[] | null;
  /** Untuk presentasi 'hotspot'. */
  scene?: SceneKey;
  /** Checklist misi (dipakai presentasi 'folder'). */
  checklist?: string[];
}

type Milik<S> = Omit<InteractionProps, 'step'> & { step: S };

/** netral = tanpa penilaian; tepat = benar tapi tidak dipilih pemain. */
type StatusOpsi = 'netral' | 'benar' | 'salah' | 'tepat';

const TEKS_STATUS: Record<StatusOpsi, string> = {
  netral: '',
  benar: 'benar',
  salah: 'perlu diperiksa',
  tepat: 'jawaban tepat',
};

// ------------------------------------------------------------------ util data

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function asText(v: StepAnswer | undefined): string {
  return typeof v === 'string' ? v : '';
}

function asList(v: StepAnswer | undefined): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function asRecord(v: StepAnswer | undefined): Record<string, string> {
  if (v === null || v === undefined || typeof v !== 'object' || Array.isArray(v)) return {};
  return v;
}

function asAngka(v: StepAnswer | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function parseAngka(s: string): number | null {
  const bersih = s.replace(/[^\d-]/g, '');
  if (bersih === '' || bersih === '-') return null;
  const n = Number(bersih);
  return Number.isFinite(n) ? n : null;
}

function teksAngka(step: NumberStep, n: number): string {
  if (step.format === 'rupiah') return formatRupiah(n);
  return step.unit ? `${n} ${step.unit}` : String(n);
}

function labelOpsi(opsi: OptionDef[], id: string): string {
  return opsi.find((o) => o.id === id)?.label ?? id;
}

/** Potong label panjang untuk tombol/tab sempit (teks penuh tetap di aria-label). */
function labelSingkat(label: string, maks = 20): string {
  const utama = label.split(' - ')[0] ?? label;
  if (utama.length <= maks) return utama;
  return utama.slice(0, maks - 1).trimEnd() + '…';
}

function kunciTeks(reveal: string[] | null | undefined): Set<string> | null {
  if (!Array.isArray(reveal)) return null;
  return new Set(reveal.map(norm));
}

/** Baris reveal assign berbentuk "Label item -> Label bucket". */
function kunciAssign(reveal: string[] | null | undefined): Map<string, string> | null {
  if (!Array.isArray(reveal)) return null;
  const map = new Map<string, string>();
  for (const baris of reveal) {
    const pisah = baris.indexOf(' -> ');
    if (pisah > 0) map.set(norm(baris.slice(0, pisah)), norm(baris.slice(pisah + 4)));
  }
  return map;
}

function statusOpsi(label: string, dipilih: boolean, kunci: Set<string> | null): StatusOpsi {
  if (!kunci) return 'netral';
  const benar = kunci.has(norm(label));
  if (dipilih) return benar ? 'benar' : 'salah';
  return benar ? 'tepat' : 'netral';
}

// ------------------------------------------------------------------ kartu opsi

function KartuPilih({
  option,
  dipilih,
  status,
  terkunci,
  tanda,
  padat,
  peran,
  onTap,
  kelasExtra,
}: {
  option: OptionDef;
  dipilih: boolean;
  status: StatusOpsi;
  terkunci: boolean;
  tanda: 'radio' | 'kotak' | 'none';
  padat?: boolean;
  peran?: 'radio' | 'checkbox';
  onTap?: () => void;
  kelasExtra?: string;
}): ReactElement {
  const kls = ['kartu'];
  if (status === 'benar') kls.push('benar');
  else if (status === 'salah') kls.push('salah');
  else if (dipilih) kls.push('terpilih');
  if (kelasExtra) kls.push(kelasExtra);

  const gaya =
    status === 'tepat'
      ? { borderStyle: 'dashed' as const, borderColor: 'var(--hijau)', background: 'var(--putih)' }
      : undefined;

  let isiTanda: ReactElement | string = '';
  if (status === 'benar' || status === 'tepat') isiTanda = <Icon name="cek" size={16} />;
  else if (status === 'salah') isiTanda = <Icon name="silang" size={16} />;
  else if (dipilih) isiTanda = tanda === 'radio' ? '●' : '✓';

  const teksStatus = TEKS_STATUS[status];

  return (
    <button
      type="button"
      className={kls.join(' ')}
      style={{ ...(padat ? { padding: '9px 12px' } : null), ...gaya }}
      onClick={onTap}
      disabled={terkunci || !onTap}
      role={peran}
      aria-checked={peran ? dipilih : undefined}
    >
      {option.icon ? (
        <span
          className="kartu-ikon"
          aria-hidden="true"
          style={padat ? { width: 34, height: 34, borderRadius: 10 } : undefined}
        >
          <Icon name={option.icon} size={padat ? 20 : 26} />
        </span>
      ) : null}
      <span className="kartu-teks">
        <span style={{ display: 'block' }}>{option.label}</span>
        {option.desc ? (
          <span className="mini lembut" style={{ display: 'block' }}>
            {option.desc}
          </span>
        ) : null}
        {teksStatus ? (
          <span className="mini tebal" style={{ display: 'block' }}>
            {teksStatus}
          </span>
        ) : null}
      </span>
      {tanda === 'none' && !teksStatus ? null : (
        <span
          className="kartu-tanda"
          aria-hidden="true"
          style={tanda === 'kotak' ? { borderRadius: 8 } : undefined}
        >
          {isiTanda}
        </span>
      )}
    </button>
  );
}

// ------------------------------------------------------------------ util multi

function usePilihanMulti(
  step: MultiStep,
  value: StepAnswer | undefined,
  onChange: (v: StepAnswer) => void,
  satuan: string,
) {
  const [pesan, setPesan] = useState<string | null>(null);
  const list = asList(value);
  const maks = Math.max(1, step.requiredSelections);

  const ubah = (id: string, sfxMasuk: 'pilih' | 'bukti' = 'pilih'): void => {
    if (list.includes(id)) {
      onChange(list.filter((x) => x !== id));
      setPesan(null);
      playSfx('pilih');
      return;
    }
    if (list.length >= maks) {
      setPesan(`Maksimal ${maks} ${satuan}`);
      return;
    }
    onChange([...list, id]);
    setPesan(null);
    playSfx(sfxMasuk);
  };

  return { list, maks, pesan, ubah };
}

function Penghitung({ label, n, maks }: { label: string; n: number; maks: number }): ReactElement {
  return (
    <span className={`chip ${n === maks ? 'chip-hijau' : 'chip-kuning'}`} aria-live="polite">
      <Icon name={n === maks ? 'cek' : 'daftar'} size={16} />
      {label} {n} / {maks}
    </span>
  );
}

function Batas({ pesan }: { pesan: string | null }): ReactElement | null {
  if (!pesan) return null;
  return (
    <p className="pesan pesan-kuning kecil" role="status" style={{ margin: 0 }}>
      <Icon name="tanya" size={18} />
      {pesan} - lepas satu dulu bila ingin ganti.
    </p>
  );
}

// ------------------------------------------------------------------ single

function SingleView({ step, value, onChange, disabled, reveal }: Milik<SingleStep>): ReactElement {
  const kunci = kunciTeks(reveal);
  const terkunci = disabled === true || kunci !== null;
  const dipilihId = asText(value);
  const padat = step.presentation === 'list';

  return (
    <div role="radiogroup" aria-label={step.prompt} style={{ display: 'grid', gap: padat ? 8 : 10 }}>
      {step.options.map((o) => {
        const dipilih = o.id === dipilihId;
        return (
          <KartuPilih
            key={o.id}
            option={o}
            dipilih={dipilih}
            status={statusOpsi(o.label, dipilih, kunci)}
            terkunci={terkunci}
            tanda="radio"
            peran="radio"
            padat={padat}
            onTap={
              terkunci
                ? undefined
                : () => {
                    onChange(o.id);
                    playSfx('pilih');
                  }
            }
          />
        );
      })}
    </div>
  );
}

// ------------------------------------------------------- multi: kartu & checklist

function MultiKartuView({ step, value, onChange, disabled, reveal }: Milik<MultiStep>): ReactElement {
  const daftar = step.presentation === 'checklist';
  const { list, maks, pesan, ubah } = usePilihanMulti(
    step,
    value,
    onChange,
    daftar ? 'pilihan' : 'kartu',
  );
  const kunci = kunciTeks(reveal);
  const terkunci = disabled === true || kunci !== null;

  return (
    <div className="stack stack-s">
      <Penghitung label="dipilih" n={list.length} maks={maks} />
      <Batas pesan={pesan} />
      <div
        style={
          daftar
            ? { display: 'grid', gap: 8 }
            : {
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              }
        }
      >
        {step.options.map((o) => {
          const dipilih = list.includes(o.id);
          return (
            <KartuPilih
              key={o.id}
              option={o}
              dipilih={dipilih}
              status={statusOpsi(o.label, dipilih, kunci)}
              terkunci={terkunci}
              tanda="kotak"
              peran="checkbox"
              onTap={terkunci ? undefined : () => ubah(o.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ multi: folder

function FolderView({ step, value, onChange, disabled, reveal, checklist }: Milik<MultiStep>): ReactElement {
  const { list, maks, pesan, ubah } = usePilihanMulti(step, value, onChange, 'dokumen');
  const kunci = kunciTeks(reveal);
  const terkunci = disabled === true || kunci !== null;
  return <div className="stack">
    <div className="folder-progress"><Icon name="dokumen" size={25} /><div><strong>Folder laporan</strong><span>{list.length} dari {maks} dokumen terkumpul</span></div></div>
    {checklist?.length ? <details className="simple-details"><summary>Dokumen apa saja yang diperlukan?</summary><ul>{checklist.map(c => <li key={c}>{c}</li>)}</ul></details> : null}
    <Batas pesan={pesan} />
    <div className="document-options">{step.options.map(o => <KartuPilih key={o.id} option={o} dipilih={list.includes(o.id)} status={statusOpsi(o.label, list.includes(o.id), kunci)} terkunci={terkunci} tanda="kotak" peran="checkbox" onTap={terkunci ? undefined : () => ubah(o.id, 'bukti')} />)}</div>
  </div>;
}

// ------------------------------------------------------------------ multi: hotspot

function HotspotView({
  step,
  value,
  onChange,
  disabled,
  reveal,
  scene,
}: Milik<MultiStep>): ReactElement {
  const { list, maks, pesan, ubah } = usePilihanMulti(step, value, onChange, 'temuan');
  const kunci = kunciTeks(reveal);
  const terkunci = disabled === true || kunci !== null;
  const temuan = list
    .map((id) => step.options.find((o) => o.id === id))
    .filter((o): o is OptionDef => o !== undefined);
  const terlewat = kunci
    ? step.options.filter((o) => !list.includes(o.id) && kunci.has(norm(o.label)))
    : [];

  return (
    <div className="stack stack-s">
      <div className="baris-antara">
        <span className="kecil tebal">Ketuk objek pada adegan</span>
        <Penghitung label="temuan" n={list.length} maks={maks} />
      </div>
      <Batas pesan={pesan} />

      <Scene scene={scene ?? 'kantor'}>
        {step.options.map((o, i) => {
          if (!o.hotspot) return null;
          const dipilih = list.includes(o.id);
          const status = statusOpsi(o.label, dipilih, kunci);
          return (
            <button
              key={o.id}
              type="button"
              aria-label={o.label}
              aria-pressed={dipilih}
              disabled={terkunci}
              onClick={() => ubah(o.id, 'bukti')}
              style={{
                position: 'absolute',
                left: `${o.hotspot.x}%`,
                top: `${o.hotspot.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                border: '3px solid var(--tinta)',
                background: dipilih ? 'var(--hijau)' : 'rgba(255, 249, 233, 0.82)',
                color: dipilih ? 'var(--putih)' : 'var(--tinta)',
                fontWeight: 900,
                fontSize: 15,
                boxShadow: 'var(--shadow-s)',
                cursor: terkunci ? 'default' : 'pointer',
                touchAction: 'manipulation',
              }}
            >
              <span aria-hidden="true">
                {status === 'benar' ? (
                  <Icon name="cek" size={20} />
                ) : status === 'salah' ? (
                  <Icon name="silang" size={20} />
                ) : dipilih ? (
                  '✓'
                ) : (
                  i + 1
                )}
              </span>
            </button>
          );
        })}
      </Scene>

      <div className="panel-krem stack stack-s">
        <span className="baris baris-rapat tebal">
          <Icon name="daftar" size={20} /> Panel Catatan
        </span>
        {temuan.length === 0 ? (
          <p className="kecil lembut" style={{ margin: 0 }}>
            Belum ada temuan. Ketuk titik bernomor pada adegan.
          </p>
        ) : (
          temuan.map((o) => (
            <KartuPilih
              key={o.id}
              option={o}
              dipilih
              status={statusOpsi(o.label, true, kunci)}
              terkunci={terkunci}
              tanda="kotak"
              padat
              kelasExtra="anim-skala"
              onTap={terkunci ? undefined : () => ubah(o.id)}
            />
          ))
        )}
        {terlewat.map((o) => (
          <KartuPilih
            key={o.id}
            option={o}
            dipilih={false}
            status="tepat"
            terkunci
            tanda="none"
            padat
          />
        ))}
        {!terkunci && temuan.length > 0 ? (
          <p className="mini lembut" style={{ margin: 0 }}>
            Ketuk catatan untuk menghapusnya.
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ util assign

function statusBucket(
  item: OptionDef,
  bucket: OptionDef,
  dipilih: boolean,
  kunci: Map<string, string> | null,
): StatusOpsi {
  if (!kunci) return 'netral';
  const benar = kunci.get(norm(item.label)) === norm(bucket.label);
  if (dipilih) return benar ? 'benar' : 'salah';
  return benar ? 'tepat' : 'netral';
}

function BucketList({
  step,
  item,
  pilihanId,
  terkunci,
  kunci,
  onPilih,
}: {
  step: AssignStep;
  item: OptionDef;
  pilihanId: string | undefined;
  terkunci: boolean;
  kunci: Map<string, string> | null;
  onPilih: (bucketId: string) => void;
}): ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={`Pilihan untuk ${item.label}`}
      style={{ display: 'grid', gap: 8 }}
    >
      {step.buckets.map((b) => {
        const dipilih = pilihanId === b.id;
        return (
          <KartuPilih
            key={b.id}
            option={dipilih && !kunci ? { ...b, desc: 'dipilih' } : b}
            dipilih={dipilih}
            status={statusBucket(item, b, dipilih, kunci)}
            terkunci={terkunci}
            tanda="radio"
            peran="radio"
            padat
            onTap={terkunci ? undefined : () => onPilih(b.id)}
          />
        );
      })}
    </div>
  );
}

function KartuItem({ item, catatan }: { item: OptionDef; catatan?: string }): ReactElement {
  return (
    <div className="kartu" style={{ background: 'var(--krem)', cursor: 'default' }}>
      {item.icon ? (
        <span className="kartu-ikon" aria-hidden="true">
          <Icon name={item.icon} size={26} />
        </span>
      ) : null}
      <span className="kartu-teks">
        <span className="tebal" style={{ display: 'block' }}>
          {item.label}
        </span>
        {catatan ? (
          <span className="mini lembut" style={{ display: 'block' }}>
            {catatan}
          </span>
        ) : null}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ assign: match

function MatchView({ step, value, onChange, disabled, reveal }: Milik<AssignStep>): ReactElement {
  const kunci = kunciAssign(reveal);
  const terkunci = disabled === true || kunci !== null;
  const peta = asRecord(value);

  return (
    <div className="stack stack-l">
      {step.items.map((item) => {
        const pilihanId = peta[item.id];
        return (
          <div key={item.id} className="stack stack-s">
            <KartuItem
              item={item}
              catatan={
                pilihanId ? `Pilihan: ${labelOpsi(step.buckets, pilihanId)}` : 'Belum dipilih'
              }
            />
            <BucketList
              step={step}
              item={item}
              pilihanId={pilihanId}
              terkunci={terkunci}
              kunci={kunci}
              onPilih={(b) => {
                onChange({ ...peta, [item.id]: b });
                playSfx('pilih');
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ assign: stage

function StageView({ step, value, onChange, disabled, reveal }: Milik<AssignStep>): ReactElement {
  const kunci = kunciAssign(reveal);
  const terkunci = disabled === true || kunci !== null;
  const peta = asRecord(value);
  const [aktif, setAktif] = useState(0);
  const item = step.items[Math.min(aktif, step.items.length - 1)];

  if (!item) {
    return (
      <p className="kecil lembut" style={{ margin: 0 }}>
        Tidak ada kasus.
      </p>
    );
  }
  const pilihanId = peta[item.id];

  return (
    <div className="stack stack-s">
      <div className="baris baris-rapat" role="tablist" aria-label={step.prompt}>
        {step.items.map((it, i) => {
          const sudah = typeof peta[it.id] === 'string';
          const ini = it.id === item.id;
          return (
            <button
              key={it.id}
              type="button"
              role="tab"
              id={`tab-${step.id}-${it.id}`}
              aria-selected={ini}
              aria-controls={`panel-${step.id}-${it.id}`}
              className={`chip chip-tap${ini ? ' terpilih' : ''}`}
              onClick={() => setAktif(i)}
            >
              <Icon name={sudah ? 'cek' : 'tanya'} size={16} />
              {labelSingkat(it.label, 12)}
              <span className="sr-only">{sudah ? ' sudah dijawab' : ' belum dijawab'}</span>
            </button>
          );
        })}
      </div>
      <p className="mini lembut" style={{ margin: 0 }} aria-live="polite">
        {step.items.filter((it) => typeof peta[it.id] === 'string').length} dari {step.items.length}{' '}
        kasus sudah dijawab
      </p>

      <div
        className="stack stack-s"
        role="tabpanel"
        id={`panel-${step.id}-${item.id}`}
        aria-labelledby={`tab-${step.id}-${item.id}`}
      >
        <KartuItem
          item={item}
          catatan={pilihanId ? `Pilihan: ${labelOpsi(step.buckets, pilihanId)}` : 'Belum dipilih'}
        />
        <BucketList
          step={step}
          item={item}
          pilihanId={pilihanId}
          terkunci={terkunci}
          kunci={kunci}
          onPilih={(b) => {
            onChange({ ...peta, [item.id]: b });
            playSfx('pilih');
          }}
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ assign: sort

function ReviewAssign({
  step,
  peta,
  kunci,
}: {
  step: AssignStep;
  peta: Record<string, string>;
  kunci: Map<string, string>;
}): ReactElement {
  return (
    <div className="stack stack-l">
      {step.items.map((item) => {
        const pilihan = step.buckets.find((b) => b.id === peta[item.id]);
        const benarLabel = kunci.get(norm(item.label));
        const tepat = pilihan !== undefined && benarLabel === norm(pilihan.label);
        const bucketBenar = step.buckets.find((b) => norm(b.label) === benarLabel);
        return (
          <div key={item.id} className="stack stack-s">
            <KartuItem item={item} />
            {pilihan ? (
              <KartuPilih
                option={pilihan}
                dipilih
                status={tepat ? 'benar' : 'salah'}
                terkunci
                tanda="kotak"
                padat
              />
            ) : (
              <p className="kecil lembut" style={{ margin: 0 }}>
                Belum dijawab.
              </p>
            )}
            {!tepat && bucketBenar ? (
              <KartuPilih
                option={bucketBenar}
                dipilih={false}
                status="tepat"
                terkunci
                tanda="none"
                padat
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SortView({ step, value, onChange, disabled, reveal }: Milik<AssignStep>): ReactElement {
  const kunci = kunciAssign(reveal);
  const peta = asRecord(value);
  const [terpilih, setTerpilih] = useState<string | null>(null);

  if (kunci) return <ReviewAssign step={step} peta={peta} kunci={kunci} />;

  const terkunci = disabled === true;
  const belum = step.items.filter((i) => typeof peta[i.id] !== 'string');
  const itemTerpilih = step.items.find((i) => i.id === terpilih) ?? null;

  const taruh = (itemId: string, bucketId: string): void => {
    onChange({ ...peta, [itemId]: bucketId });
    setTerpilih(null);
    playSfx('bukti');
  };

  const keluarkan = (itemId: string): void => {
    const baru = { ...peta };
    delete baru[itemId];
    onChange(baru);
    playSfx('pilih');
  };

  return (
    <div className="stack">
      <div className="stack stack-s">
        <span className="kecil tebal">Bukti yang belum dikategorikan</span>
        {belum.length === 0 ? (
          <p className="kecil lembut" style={{ margin: 0 }}>
            Semua bukti sudah masuk kategori.
          </p>
        ) : (
          belum.map((item) => (
            <div key={item.id} className="stack stack-s">
              <KartuPilih
                option={item.id === terpilih ? { ...item, desc: 'dipilih' } : item}
                dipilih={item.id === terpilih}
                status="netral"
                terkunci={terkunci}
                tanda="radio"
                onTap={
                  terkunci
                    ? undefined
                    : () => {
                        setTerpilih(item.id === terpilih ? null : item.id);
                        playSfx('pilih');
                      }
                }
              />
              <div className="baris baris-rapat">
                {step.buckets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="chip chip-tap"
                    disabled={terkunci}
                    aria-label={`Tempatkan ${item.label} ke ${b.label}`}
                    onClick={() => taruh(item.id, b.id)}
                  >
                    {b.icon ? <Icon name={b.icon} size={16} /> : null}
                    {labelSingkat(b.label, 16)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {itemTerpilih ? (
        <p className="pesan pesan-info kecil" role="status" style={{ margin: 0 }}>
          <Icon name="tanya" size={18} />
          Dipilih: {itemTerpilih.label}. Ketuk kategori untuk menempatkannya.
        </p>
      ) : null}

      {step.buckets.map((b) => {
        const isi = step.items.filter((i) => peta[i.id] === b.id);
        return (
          <div key={b.id} className="panel-krem stack stack-s">
            <span className="baris baris-rapat tebal">
              {b.icon ? <Icon name={b.icon} size={20} /> : null} {b.label}
            </span>
            <button
              type="button"
              className="btn btn-garis btn-blok"
              disabled={terkunci || itemTerpilih === null}
              onClick={() => itemTerpilih && taruh(itemTerpilih.id, b.id)}
            >
              {itemTerpilih
                ? `Taruh "${labelSingkat(itemTerpilih.label, 18)}" di sini`
                : 'Pilih bukti dulu'}
            </button>
            {isi.length === 0 ? (
              <p className="mini lembut" style={{ margin: 0 }}>
                Kosong.
              </p>
            ) : (
              isi.map((i) => (
                <KartuPilih
                  key={i.id}
                  option={i}
                  dipilih
                  status="netral"
                  terkunci={terkunci}
                  tanda="kotak"
                  padat
                  kelasExtra="anim-skala"
                  onTap={terkunci ? undefined : () => keluarkan(i.id)}
                />
              ))
            )}
          </div>
        );
      })}
      {!terkunci ? (
        <p className="mini lembut" style={{ margin: 0 }}>
          Ketuk bukti di dalam kategori untuk mengeluarkannya.
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ number

function NumberView({ step, value, onChange, disabled, reveal }: Milik<NumberStep>): ReactElement {
  const angka = asAngka(value);
  const locked = disabled === true || Array.isArray(reveal);
  return <div className="stack">
    <div className="number-options" role="group" aria-label="Pilih angka">{step.suggestions?.map(n => <button key={n} type="button" className={'number-option ' + (angka === n ? 'selected' : '')} aria-pressed={angka === n} disabled={locked} onClick={() => { onChange(n); playSfx('pilih'); }}>{teksAngka(step, n)}{angka === n ? <Icon name="cek" size={19} /> : null}</button>)}</div>
    <details className="simple-details"><summary>Isi angka lainnya</summary><label className="sr-only" htmlFor={'angka-' + step.id}>Jawaban angka</label><input id={'angka-' + step.id} className="kolom" type="text" inputMode="numeric" autoComplete="off" placeholder="Tulis angka" value={angka === null ? '' : String(angka)} disabled={locked} onChange={e => onChange(parseAngka(e.target.value))} /></details>
    {angka !== null && !step.suggestions?.includes(angka) ? <p className="kecil" aria-live="polite">Jawabanmu: {teksAngka(step, angka)}</p> : null}
    {reveal?.length ? <p className="kecil">Jawaban tepat: {reveal.join(', ')}</p> : null}
  </div>;
}

// ------------------------------------------------------------------ order

function urutanSaat(step: OrderStep, value: StepAnswer | undefined): string[] {
  const ada = asList(value).filter((id) => step.items.some((i) => i.id === id));
  const sisa = step.items.map((i) => i.id).filter((id) => !ada.includes(id));
  return [...ada, ...sisa];
}

function OrderView({ step, value, onChange, disabled, reveal }: Milik<OrderStep>): ReactElement {
  const terkunci = disabled === true || Array.isArray(reveal);
  const urutan = urutanSaat(step, value);

  const geser = (i: number, arah: -1 | 1): void => {
    const j = i + arah;
    const a = urutan[i];
    const b = urutan[j];
    if (a === undefined || b === undefined) return;
    const baru = [...urutan];
    baru[i] = b;
    baru[j] = a;
    onChange(baru);
    playSfx('pilih');
  };

  return (
    <div className="stack stack-s">
      <p className="kecil lembut" style={{ margin: 0 }}>
        Susun dari langkah pertama ke terakhir.
      </p>
      {urutan.map((id, i) => {
        const item = step.items.find((o) => o.id === id);
        if (!item) return null;
        return (
          <div key={id} className="kartu" style={{ cursor: 'default' }}>
            <span className="kartu-ikon tebal" aria-hidden="true">
              {i + 1}
            </span>
            <span className="kartu-teks">{item.label}</span>
            <span className="baris baris-rapat">
              <button
                type="button"
                className="btn btn-netral"
                style={{ padding: '10px 12px' }}
                disabled={terkunci || i === 0}
                aria-label={`Naikkan ${item.label}`}
                onClick={() => geser(i, -1)}
              >
                {'↑'}
              </button>
              <button
                type="button"
                className="btn btn-netral"
                style={{ padding: '10px 12px' }}
                disabled={terkunci || i === urutan.length - 1}
                aria-label={`Turunkan ${item.label}`}
                onClick={() => geser(i, 1)}
              >
                {'↓'}
              </button>
            </span>
          </div>
        );
      })}
      {reveal && reveal.length > 0 ? (
        <p className="kecil tebal" style={{ margin: 0 }}>
          Urutan tepat: {reveal.join(', ')}
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ renderer

export function StepRenderer(props: InteractionProps): ReactElement {
  const { step } = props;

  let isi: ReactElement;
  if (step.kind === 'single') {
    isi = <SingleView {...props} step={step} />;
  } else if (step.kind === 'multi') {
    if (step.presentation === 'hotspot') isi = <HotspotView {...props} step={step} />;
    else if (step.presentation === 'folder') isi = <FolderView {...props} step={step} />;
    else isi = <MultiKartuView {...props} step={step} />;
  } else if (step.kind === 'assign') {
    if (step.presentation === 'sort') isi = <SortView {...props} step={step} />;
    else if (step.presentation === 'stage') isi = <StageView {...props} step={step} />;
    else isi = <MatchView {...props} step={step} />;
  } else if (step.kind === 'number') {
    isi = <NumberView {...props} step={step} />;
  } else {
    isi = <OrderView {...props} step={step} />;
  }

  return (
    <div>
      {isi}{step.hint ? <details className="simple-details interaction-hint"><summary>Butuh petunjuk?</summary><p className="kecil lembut">{step.hint}</p></details> : null}
    </div>
  );
}

// ------------------------------------------------------------------ ringkasan

export function ringkasJawaban(step: StepDef, value: StepAnswer | undefined): string {
  const kosong = 'Belum dijawab';
  if (step.kind === 'single') {
    const id = asText(value);
    return id ? labelOpsi(step.options, id) : kosong;
  }
  if (step.kind === 'multi') {
    const list = asList(value);
    return list.length > 0 ? list.map((id) => labelOpsi(step.options, id)).join(', ') : kosong;
  }
  if (step.kind === 'assign') {
    const peta = asRecord(value);
    const baris = step.items
      .filter((i) => typeof peta[i.id] === 'string')
      .map((i) => `${i.label} -> ${labelOpsi(step.buckets, peta[i.id] ?? '')}`);
    return baris.length > 0 ? baris.join('; ') : kosong;
  }
  if (step.kind === 'number') {
    const n = asAngka(value);
    return n === null ? kosong : teksAngka(step, n);
  }
  const list = asList(value);
  return list.length > 0 ? list.map((id) => labelOpsi(step.items, id)).join(' -> ') : kosong;
}

export function langkahTerisi(step: StepDef, value: StepAnswer | undefined): boolean {
  if (step.kind === 'single') return asText(value).length > 0;
  if (step.kind === 'multi') return asList(value).length >= 1;
  if (step.kind === 'assign') {
    const peta = asRecord(value);
    return (
      step.items.length > 0 &&
      step.items.every((i) => typeof peta[i.id] === 'string' && peta[i.id] !== '')
    );
  }
  if (step.kind === 'number') return asAngka(value) !== null;
  return step.items.length > 0 && asList(value).length === step.items.length;
}
