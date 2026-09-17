// Sisi JavaScript dari bridge Unity <-> React untuk RAKSA GAME.
// Dipanggil dari C# lewat [DllImport("__Internal")].
//
// Pesan dari Unity diteruskan ke window.RaksaUnityReceive(json). Bila React
// belum memasang handler (mis. Unity siap lebih dulu), pesan ditahan di antrean
// supaya tidak ada yang hilang.

mergeInto(LibraryManager.library, {
  RaksaBridgeSend: function (ptr) {
    var json = UTF8ToString(ptr);
    try {
      if (typeof window.RaksaUnityReceive === 'function') {
        window.RaksaUnityReceive(json);
      } else {
        window.__raksaUnityQueue = window.__raksaUnityQueue || [];
        // Batasi antrean supaya tidak tumbuh tanpa batas bila React tidak pernah siap.
        if (window.__raksaUnityQueue.length < 200) {
          window.__raksaUnityQueue.push(json);
        }
      }
    } catch (e) {
      console.error('[RaksaBridge] gagal meneruskan pesan:', e);
    }
  },

  RaksaBridgeLog: function (ptr) {
    console.log('[Unity] ' + UTF8ToString(ptr));
  },

  // Dipakai QualityManager untuk mengetahui batas DPR & kemampuan perangkat.
  RaksaBridgeGetDevicePixelRatio: function () {
    return window.devicePixelRatio || 1;
  },
});
