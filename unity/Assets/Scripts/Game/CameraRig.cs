using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Kamera tetap bersudut isometrik. Pemain TIDAK mengatur kamera bebas;
    /// perpindahan hanya lewat tombol sudut pandang ("Depan", "Sisi kiri", ...)
    /// atau otomatis saat berpindah kasus.
    /// </summary>
    public class CameraRig : MonoBehaviour
    {
        [System.Serializable]
        public class View
        {
            /// <summary>default | depan | kiri | kanan | atas</summary>
            public string id = "default";
            public Vector3 position = new Vector3(6f, 5.5f, -6f);
            public Vector3 lookAt = Vector3.zero;
            public float fieldOfView = 30f;
        }

        public Camera targetCamera;
        public View[] views;
        public float moveSeconds = 0.55f;

        [Header("Auto-fit")]
        [Tooltip("Radius cadangan bila bounds diorama belum diketahui.")]
        public float fitRadius = 7.5f;

        [Tooltip("Sesuaikan jarak kamera dengan rasio canvas supaya diorama tidak terpotong.")]
        public bool autoFit = true;

        /// <summary>
        /// Pusat & radius diorama yang sedang aktif, diukur dari renderer-nya.
        /// Dipakai daripada angka tetap: tiap diorama berbeda ukuran, dan
        /// menebak radius membuat adegan terpotong atau terlalu kecil.
        /// </summary>
        private Vector3 _pusat;
        private float _radius = -1f;
        private bool _adaBounds;

        public void SetFitBounds(Bounds b)
        {
            _pusat = b.center;
            // extents.magnitude = radius bola yang melingkupi seluruh kotak
            _radius = Mathf.Max(0.5f, b.extents.magnitude);
            _adaBounds = true;
            _aspectTerakhir = -1f;
            if (_t >= 1f) Apply(1f);
        }

        public void ClearFitBounds()
        {
            _adaBounds = false;
            _radius = -1f;
        }

        private View _current;
        private Vector3 _fromPos;
        private Quaternion _fromRot;
        private float _fromFov;
        private float _t = 1f;
        private bool _reducedMotion;

        public string CurrentViewId
        {
            get { return _current != null ? _current.id : "default"; }
        }

        private void Awake()
        {
            if (targetCamera == null) targetCamera = GetComponentInChildren<Camera>();
        }

        public void SetReducedMotion(bool reduced)
        {
            _reducedMotion = reduced;
        }

        /// <summary>Pasang daftar view untuk diorama yang aktif.</summary>
        public void UseViews(View[] next)
        {
            views = next;
            _current = null;
            GoTo("default", true);
        }

        public bool HasView(string id)
        {
            if (views == null || string.IsNullOrEmpty(id)) return false;
            for (int i = 0; i < views.Length; i++)
            {
                if (views[i] != null && views[i].id == id) return true;
            }
            return false;
        }

        public void GoTo(string id, bool instant)
        {
            if (views == null || views.Length == 0 || targetCamera == null) return;
            View found = null;
            for (int i = 0; i < views.Length; i++)
            {
                if (views[i] != null && views[i].id == id) { found = views[i]; break; }
            }
            if (found == null) found = views[0];
            if (found == _current && !instant) return;

            _current = found;
            _fromPos = targetCamera.transform.position;
            _fromRot = targetCamera.transform.rotation;
            _fromFov = targetCamera.fieldOfView;
            _t = (instant || _reducedMotion || moveSeconds <= 0f) ? 1f : 0f;
            if (_t >= 1f) Apply(1f);
        }

        private float _aspectTerakhir = -1f;

        private void Update()
        {
            if (targetCamera == null || _current == null) return;

            // Canvas bisa berubah ukuran (rotasi HP, keyboard muncul, proyektor).
            // Bila rasionya berubah, framing dihitung ulang supaya diorama tetap utuh.
            float aspect = targetCamera.aspect;
            if (autoFit && Mathf.Abs(aspect - _aspectTerakhir) > 0.01f)
            {
                _aspectTerakhir = aspect;
                if (_t >= 1f) Apply(1f);
            }

            if (_t >= 1f) return;
            _t = Mathf.Min(1f, _t + Time.deltaTime / Mathf.Max(0.05f, moveSeconds));
            Apply(_t);
        }

        /**
         * Posisi kamera akhir untuk view saat ini.
         *
         * Arah pandang tetap seperti yang dirancang generator, tetapi JARAKNYA
         * dihitung dari rasio canvas. Tanpa ini, diorama yang dirancang untuk
         * satu rasio akan terpotong di rasio lain: HP portrait, area 4:3 di
         * layar bermain, dan proyektor 16:9 semuanya berbeda.
         */
        /// <summary>Titik yang dipandang: pusat bounds bila diketahui.</summary>
        private Vector3 TitikPandang(View v)
        {
            return _adaBounds ? _pusat : v.lookAt;
        }

        private Vector3 PosisiFit(View v)
        {
            if (!autoFit || targetCamera == null) return v.position;

            float radius = _adaBounds && _radius > 0f ? _radius : fitRadius;
            if (radius <= 0f) return v.position;

            var pandang = TitikPandang(v);
            // Arah pandang tetap seperti rancangan generator; hanya jaraknya dihitung.
            var arah = v.position - v.lookAt;
            if (arah.sqrMagnitude < 0.0001f) return v.position;

            float aspect = targetCamera.aspect;
            if (aspect <= 0f) aspect = 1f;

            float setengahV = Mathf.Deg2Rad * v.fieldOfView * 0.5f;
            // Sudut horizontal mengikuti rasio canvas; sisi tersempit yang menentukan.
            float setengahH = Mathf.Atan(Mathf.Tan(setengahV) * aspect);
            float sempit = Mathf.Min(setengahV, setengahH);
            float sin = Mathf.Sin(sempit);
            if (sin < 0.01f) return v.position;

            // Sedikit margin supaya objek di tepi tidak menempel bingkai.
            float jarak = (radius * 1.08f) / sin;
            return pandang + arah.normalized * jarak;
        }

        private void Apply(float t)
        {
            // ease-in-out supaya perpindahan terasa halus tetapi singkat
            float e = t < 0.5f ? 2f * t * t : 1f - Mathf.Pow(-2f * t + 2f, 2f) / 2f;
            var tujuan = PosisiFit(_current);
            var pandang = TitikPandang(_current);
            var targetRot = Quaternion.LookRotation((pandang - tujuan).normalized, Vector3.up);
            targetCamera.transform.position = Vector3.Lerp(_fromPos, tujuan, e);
            targetCamera.transform.rotation = Quaternion.Slerp(_fromRot, targetRot, e);
            targetCamera.fieldOfView = Mathf.Lerp(_fromFov, _current.fieldOfView, e);

            // Pastikan seluruh diorama ada di antara near & far plane.
            float radius = _adaBounds && _radius > 0f ? _radius : fitRadius;
            float jarakPandang = Vector3.Distance(targetCamera.transform.position, pandang);
            targetCamera.nearClipPlane = Mathf.Max(0.05f, (jarakPandang - radius) * 0.5f);
            targetCamera.farClipPlane = jarakPandang + radius * 3f;
        }
    }
}
