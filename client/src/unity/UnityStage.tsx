/**
 * Panggung adegan: memakai Unity bila builnya ada, kalau tidak memakai
 * adegan SVG (mode ringan). Tidak pernah memalsukan progres atau simulasi.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BRIDGE_VERSION } from '@shared/unityBridge';
import { useReducedMotion } from '../hooks';
import { sendToUnity } from './bridge';
import { unityRuntime } from './unityLoader';

interface UnityStageProps {
  enabled: boolean;
  /** Adegan SVG yang sudah ada; dipakai saat Unity tidak tersedia. */
  fallback: ReactNode;
  aspect?: string;
  label?: string;
}

export function UnityStage({ enabled, fallback, aspect = '4 / 3', label }: UnityStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initTerkirim = useRef(false);
  const kurangiGerak = useReducedMotion();
  const [percobaan, setPercobaan] = useState(0);
  const [, render] = useState(0);

  // Status & progres runtime hidup di luar React; ikut berubah -> render ulang.
  useEffect(() => unityRuntime.subscribe(() => render((n) => n + 1)), []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (canvas) void unityRuntime.ensureLoaded(canvas);
    // Sengaja tidak dispose saat unmount: StrictMode memasang efek dua kali dan
    // runtime hanya boleh dimuat sekali per sesi.
  }, [enabled, percobaan]);

  /**
   * Jabat tangan: begitu runtime siap, kirim 'initialize'. Ini WAJIB - sisi C#
   * hanya mengirim 'unityReady' setelah menerima 'initialize', dan semua pesan
   * lain (loadMission, setPhase, ...) menunggu 'unityReady' di antrean. Tanpa
   * langkah ini Unity berjalan tetapi tidak pernah menerima perintah apa pun.
   *
   * Tanpa dependency array: komponen ini sudah render ulang setiap kali status
   * runtime berubah, dan ref di bawah menjaga pengiriman tetap sekali saja.
   */
  useEffect(() => {
    if (!enabled || initTerkirim.current) return;
    if (unityRuntime.getStatus() !== 'ready') return;
    initTerkirim.current = true;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    sendToUnity({
      type: 'initialize',
      version: BRIDGE_VERSION,
      reducedMotion: kurangiGerak,
      quality: 'auto',
      maxDpr: Math.min(1.5, Math.max(1, dpr)),
    });
  });

  if (!enabled) return <>{fallback}</>;

  const status = unityRuntime.getStatus();
  const persen = Math.round(unityRuntime.progress() * 100);

  if (status === 'unavailable' || status === 'unsupported') {
    return (
      <div>
        {fallback}
        <p className="mini lembut" style={{ marginTop: 6 }}>
          Mode ringan
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div>
        {fallback}
        <div
          className="baris"
          style={{ marginTop: 8, gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <span className="mini lembut">Tampilan 3D gagal dimuat. Kamu tetap bisa bermain.</span>
          <button
            type="button"
            className="btn btn-garis btn-kecil"
            onClick={() => {
              unityRuntime.dispose();
              setPercobaan((n) => n + 1);
            }}
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const siap = status === 'ready';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspect,
        maxHeight: '46vh',
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--hijau-pucat, #eef5e9)',
      }}
    >
      <canvas
        ref={canvasRef}
        // WAJIB punya id: framework Unity menyusun selector dari canvas.id.
        // Tanpa id, selector-nya jadi "#" dan runtime gagal dengan
        // DOMException "'#' is not a valid selector".
        id="unity-canvas"
        tabIndex={-1}
        role="img"
        aria-label={label ?? 'Adegan kota Raksa'}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          // Hanya canvas yang diatur; halaman tetap bisa digeser seperti biasa.
          touchAction: 'manipulation',
          opacity: siap ? 1 : 0,
        }}
      />
      {!siap && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>Menyiapkan kotamu...</span>
          <div
            style={{
              width: 'min(220px, 80%)',
              height: 6,
              borderRadius: 4,
              background: '#dfe4d8',
              overflow: 'hidden',
            }}
          >
            <i
              style={{
                display: 'block',
                height: '100%',
                width: `${persen}%`,
                background: '#427348',
              }}
            />
          </div>
          <span className="mini lembut">{persen}%</span>
        </div>
      )}
    </div>
  );
}
