import type { KamusRuang } from '.';

/** Kata singkat yang digambar engine di dalam adegan (maks ±12 huruf Latin / 6 aksara). */
const kamus: KamusRuang = {
  id: { difoto: 'Difoto', masukFolder: 'Masuk folder', dicatat: 'Dicatat', didengar: 'Didengar', dipilih: 'Dipilih', ditandai: 'Ditandai', dibatalkan: 'Dibatalkan', dijeda: 'Dijeda' },
  en: { difoto: 'Photographed', masukFolder: 'Filed', dicatat: 'Noted', didengar: 'Heard', dipilih: 'Selected', ditandai: 'Tagged', dibatalkan: 'Cancelled', dijeda: 'Paused' },
  zh: { difoto: '已拍照', masukFolder: '已归档', dicatat: '已记录', didengar: '已听取', dipilih: '已选择', ditandai: '已标记', dibatalkan: '已取消', dijeda: '已暂停' },
};
export default kamus;
