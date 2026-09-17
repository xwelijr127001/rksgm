using Raksa.Bridge;
using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Karakter petugas Raksa. Berjalan OTOMATIS ke lokasi misi - pemain tidak
    /// perlu mengendalikan gerakan. Animasi singkat dan tidak menunda tugas:
    /// pemain sudah bisa mengetuk objek walau karakter masih berjalan.
    /// </summary>
    public class CharacterMover : MonoBehaviour
    {
        [Header("Bagian tubuh untuk warna & aksesori")]
        public Renderer uniformRenderer;
        public Renderer skinRenderer;
        public Renderer hairRenderer;
        public GameObject helm;
        public GameObject jaket;
        public GameObject headset;
        public GameObject topi;

        [Header("Gerak")]
        public float walkSeconds = 1.1f;
        public float bobHeight = 0.06f;
        public Transform visual;

        /// <summary>Palet seragam; urutannya sama dengan UNIFORM_COLORS di shared/brand.ts.</summary>
        public Color[] uniformColors = new Color[]
        {
            new Color(0.09f, 0.42f, 0.27f),
            new Color(0.18f, 0.44f, 0.69f),
            new Color(0.77f, 0.27f, 0.18f),
            new Color(0.36f, 0.27f, 0.21f),
            new Color(0.54f, 0.42f, 0.12f),
            new Color(0.25f, 0.24f, 0.54f),
        };

        public Color[] skinTones = new Color[]
        {
            new Color(0.95f, 0.79f, 0.63f),
            new Color(0.88f, 0.67f, 0.49f),
            new Color(0.78f, 0.54f, 0.37f),
            new Color(0.61f, 0.38f, 0.25f),
            new Color(0.48f, 0.29f, 0.18f),
        };

        public Color[] hairColors = new Color[]
        {
            new Color(0.17f, 0.13f, 0.09f),
            new Color(0.29f, 0.21f, 0.15f),
            new Color(0.43f, 0.29f, 0.18f),
            new Color(0.08f, 0.08f, 0.08f),
            new Color(0.49f, 0.42f, 0.35f),
        };

        private Vector3 _from;
        private Vector3 _to;
        private float _t = 1f;
        private bool _reducedMotion;
        private float _reactTimer;

        public void SetReducedMotion(bool reduced)
        {
            _reducedMotion = reduced;
        }

        public void ApplyLook(PlayerLookDto look)
        {
            if (look == null) return;
            if (uniformRenderer != null && uniformColors.Length > 0)
            {
                uniformRenderer.material.color = uniformColors[Mod(look.color, uniformColors.Length)];
            }
            if (skinRenderer != null && skinTones.Length > 0)
            {
                skinRenderer.material.color = skinTones[Mod(look.skin, skinTones.Length)];
            }
            if (hairRenderer != null && hairColors.Length > 0)
            {
                hairRenderer.material.color = hairColors[Mod(look.hair, hairColors.Length)];
            }

            string acc = string.IsNullOrEmpty(look.accessory) ? "none" : look.accessory;
            if (helm != null) helm.SetActive(acc == "helm");
            if (jaket != null) jaket.SetActive(acc == "jaket");
            if (headset != null) headset.SetActive(acc == "headset");
            if (topi != null) topi.SetActive(acc == "topi");
        }

        private static int Mod(int v, int n)
        {
            if (n <= 0) return 0;
            int m = v % n;
            return m < 0 ? m + n : m;
        }

        /// <summary>Pindahkan karakter ke lokasi misi.</summary>
        public void MoveTo(Transform entry, Transform stand)
        {
            if (stand == null) return;
            _to = stand.position;
            if (_reducedMotion || entry == null || walkSeconds <= 0f)
            {
                transform.position = _to;
                transform.rotation = stand.rotation;
                _t = 1f;
                return;
            }
            transform.position = entry.position;
            _from = entry.position;
            _t = 0f;
            var dir = _to - _from;
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.0001f) transform.rotation = Quaternion.LookRotation(dir.normalized, Vector3.up);
        }

        /// <summary>Respons singkat karakter saat pembahasan / misi selesai.</summary>
        public void React(string kind)
        {
            if (_reducedMotion) return;
            _reactTimer = kind == "salah" ? 0.5f : 0.75f;
        }

        private void Update()
        {
            if (_t < 1f)
            {
                _t = Mathf.Min(1f, _t + Time.deltaTime / Mathf.Max(0.05f, walkSeconds));
                float e = _t < 0.5f ? 2f * _t * _t : 1f - Mathf.Pow(-2f * _t + 2f, 2f) / 2f;
                var p = Vector3.Lerp(_from, _to, e);
                // langkah kecil naik-turun supaya terasa berjalan
                p.y += Mathf.Abs(Mathf.Sin(_t * Mathf.PI * 4f)) * bobHeight;
                transform.position = p;
            }

            if (_reactTimer > 0f && visual != null)
            {
                _reactTimer = Mathf.Max(0f, _reactTimer - Time.deltaTime);
                float s = 1f + Mathf.Sin(_reactTimer * Mathf.PI * 3f) * 0.05f;
                visual.localScale = new Vector3(s, s, s);
                if (_reactTimer <= 0f) visual.localScale = Vector3.one;
            }
        }
    }
}
