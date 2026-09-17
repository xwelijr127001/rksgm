using System.Collections.Generic;
using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Akar satu diorama misi (mis. "parkiran", "proyek", "pelabuhan").
    /// Semua diorama berada dalam SATU scene Unity dan hanya satu yang aktif,
    /// supaya perpindahan misi instan dan runtime tidak perlu dimuat ulang.
    /// </summary>
    public class DioramaRoot : MonoBehaviour
    {
        [Tooltip("Harus sama dengan SceneKey di shared/types.ts")]
        public string sceneKey;

        public CameraRig.View[] cameraViews;

        [Tooltip("Titik berhenti karakter petugas di diorama ini.")]
        public Transform characterStand;

        [Tooltip("Titik awal karakter saat berjalan masuk.")]
        public Transform characterEntry;

        private readonly Dictionary<string, Tappable> _byAnchor = new Dictionary<string, Tappable>(16);
        private Tappable[] _all;
        private bool _indexed;

        public Tappable[] All
        {
            get
            {
                EnsureIndex();
                return _all;
            }
        }

        private void EnsureIndex()
        {
            if (_indexed) return;
            _all = GetComponentsInChildren<Tappable>(true);
            _byAnchor.Clear();
            for (int i = 0; i < _all.Length; i++)
            {
                var t = _all[i];
                if (t == null || string.IsNullOrEmpty(t.stepId) || string.IsNullOrEmpty(t.optionId)) continue;
                _byAnchor[t.Anchor] = t;
            }
            _indexed = true;
        }

        /// <summary>Paksa index dibangun ulang (dipakai setelah generator mengubah scene).</summary>
        public void Reindex()
        {
            _indexed = false;
            EnsureIndex();
        }

        public Tappable Find(string anchor)
        {
            EnsureIndex();
            Tappable t;
            return _byAnchor.TryGetValue(anchor, out t) ? t : null;
        }

        public void HideAllMarkers()
        {
            EnsureIndex();
            for (int i = 0; i < _all.Length; i++)
            {
                if (_all[i] == null) continue;
                _all[i].SetSelected(false, false);
                _all[i].SetInteractable(false);
            }
        }
    }
}
