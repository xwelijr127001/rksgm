using Raksa.Bridge;
using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Objek di diorama yang dapat diketuk pemain.
    /// ID-nya berasal dari data misi (stepId + optionId) sehingga ketukan di
    /// canvas mengisi draft jawaban yang sama dengan kontrol HTML.
    ///
    /// Penanda TIDAK mengandalkan warna saja: ada cincin, ikon, dan nomor.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class Tappable : MonoBehaviour
    {
        [Header("Identitas (diisi generator dari data misi)")]
        public string stepId;
        public string optionId;
        public string label;
        /// <summary>hotspot | bukti | dokumen | kasus | angka</summary>
        public string kind = "bukti";
        public bool multi;
        /// <summary>Nomor penanda yang tampil di scene (bukan urutan jawaban benar).</summary>
        public int markerNumber;

        [Header("Visual")]
        public Transform marker;
        public Transform highlight;
        public Renderer[] tintTargets;

        private bool _selected;
        private bool _interactable = true;
        private Vector3 _markerBaseScale = Vector3.one;
        private float _pop;
        private bool _reducedMotion;

        public string Anchor
        {
            get { return stepId + ":" + optionId; }
        }

        public bool Selected
        {
            get { return _selected; }
        }

        private void Awake()
        {
            if (marker != null) _markerBaseScale = marker.localScale;
            ApplyVisual();
        }

        public void Configure(BridgeObjectDto dto, int number)
        {
            stepId = dto.stepId;
            optionId = dto.optionId;
            label = dto.label;
            kind = string.IsNullOrEmpty(dto.kind) ? "bukti" : dto.kind;
            multi = dto.multi;
            markerNumber = number;
            ApplyVisual();
        }

        public void SetReducedMotion(bool reduced)
        {
            _reducedMotion = reduced;
            if (reduced) _pop = 0f;
        }

        public void SetInteractable(bool value)
        {
            if (_interactable == value) return;
            _interactable = value;
            var col = GetComponent<Collider>();
            if (col != null) col.enabled = value;
            ApplyVisual();
        }

        public void SetSelected(bool value, bool playFeedback)
        {
            if (_selected == value && !playFeedback) return;
            _selected = value;
            if (playFeedback && !_reducedMotion) _pop = 1f;
            ApplyVisual();
        }

        /// <summary>Respons visual saat diketuk, dipanggil GameRoot.</summary>
        public void PlayTapResponse()
        {
            if (!_reducedMotion) _pop = 1f;
        }

        private void ApplyVisual()
        {
            if (highlight != null) highlight.gameObject.SetActive(_selected);
            if (marker != null)
            {
                marker.gameObject.SetActive(_interactable || _selected);
            }
            if (tintTargets != null)
            {
                for (int i = 0; i < tintTargets.Length; i++)
                {
                    var r = tintTargets[i];
                    if (r == null) continue;
                    // Sorot lembut saat terpilih; bentuk & cincin tetap jadi penanda utama.
                    r.material.SetFloat("_RaksaSelected", _selected ? 1f : 0f);
                }
            }
        }

        /// <summary>Kamera aktif; di-cache supaya tidak mencari setiap frame.</summary>
        private static Camera _cam;

        private void Update()
        {
            if (marker == null) return;

            // Penanda selalu dihadapkan ke kamera supaya tetap terbaca dan area
            // sentuhnya tidak menyempit pada sudut pandang samping. Penanda dibentuk
            // dari piringan (silinder), jadi sisi datarnya searah local +Y.
            if (marker.gameObject.activeInHierarchy)
            {
                if (_cam == null) _cam = Camera.main;
                if (_cam != null)
                {
                    Vector3 ke = _cam.transform.position - marker.position;
                    if (ke.sqrMagnitude > 0.0001f)
                    {
                        marker.rotation = Quaternion.FromToRotation(Vector3.up, ke.normalized);
                    }
                }
            }

            if (_pop <= 0f) return;
            _pop = Mathf.Max(0f, _pop - Time.deltaTime * 4.5f);
            float s = 1f + Mathf.Sin(_pop * Mathf.PI) * 0.28f;
            marker.localScale = _markerBaseScale * s;
            if (_pop <= 0f) marker.localScale = _markerBaseScale;
        }
    }
}
