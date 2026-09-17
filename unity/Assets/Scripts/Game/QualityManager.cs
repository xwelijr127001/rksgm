using Raksa.Bridge;
using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Menjaga performa di HP kelas menengah: batasi resolusi render, bayangan,
    /// dan partikel. Resolusi TIDAK langsung mengikuti seluruh devicePixelRatio.
    /// </summary>
    public class QualityManager : MonoBehaviour
    {
        public int targetFrameRate = 30;
        /// <summary>Batas atas skala render; 1.5 sudah cukup tajam di HP.</summary>
        public float maxRenderScale = 1.5f;
        public Light mainLight;

        private string _tier = "auto";
        private float _maxDpr = 1.5f;
        private int _lastWidth;
        private int _lastHeight;

        public string Tier { get { return _tier; } }

        private void Start()
        {
            Application.targetFrameRate = targetFrameRate;
            QualitySettings.vSyncCount = 0;
            Apply();
        }

        public void Configure(string tier, float maxDpr)
        {
            _tier = string.IsNullOrEmpty(tier) ? "auto" : tier;
            if (maxDpr > 0f) _maxDpr = Mathf.Clamp(maxDpr, 1f, 3f);
            Apply();
        }

        private bool Ringan()
        {
            if (_tier == "ringan") return true;
            if (_tier == "tinggi") return false;
            // auto: perangkat dengan memori kecil / inti sedikit dianggap ringan
            return SystemInfo.systemMemorySize > 0 && SystemInfo.systemMemorySize < 3000;
        }

        private void Apply()
        {
            bool ringan = Ringan();

            QualitySettings.shadows = ringan ? ShadowQuality.Disable : ShadowQuality.HardOnly;
            QualitySettings.shadowResolution = ShadowResolution.Low;
            QualitySettings.shadowDistance = ringan ? 0f : 26f;
            QualitySettings.antiAliasing = 0;
            QualitySettings.softParticles = false;
            QualitySettings.realtimeReflectionProbes = false;
            QualitySettings.billboardsFaceCameraPosition = false;
            QualitySettings.skinWeights = SkinWeights.TwoBones;
            QualitySettings.particleRaycastBudget = ringan ? 16 : 64;
            QualitySettings.lodBias = ringan ? 0.7f : 1f;

            if (mainLight != null) mainLight.shadows = ringan ? LightShadows.None : LightShadows.Hard;

            ApplyResolution(ringan);
        }

        private void ApplyResolution(bool ringan)
        {
            float dpr = Mathf.Clamp(RaksaBridge.DevicePixelRatio(), 1f, 3f);
            float cap = ringan ? 1f : Mathf.Min(maxRenderScale, _maxDpr);
            float scale = Mathf.Min(dpr, cap) / dpr;
            if (scale >= 0.999f) return;

            int w = Mathf.Max(320, Mathf.RoundToInt(Screen.width * scale));
            int h = Mathf.Max(240, Mathf.RoundToInt(Screen.height * scale));
            if (w == _lastWidth && h == _lastHeight) return;
            _lastWidth = w;
            _lastHeight = h;
            Screen.SetResolution(w, h, false);
        }

        private float _check;

        private void Update()
        {
            // Viewport HP berubah saat rotasi / keyboard muncul: sesuaikan berkala.
            _check += Time.unscaledDeltaTime;
            if (_check < 1f) return;
            _check = 0f;
            ApplyResolution(Ringan());
        }
    }
}
