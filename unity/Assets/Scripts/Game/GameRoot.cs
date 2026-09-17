using System.Collections.Generic;
using Raksa.Bridge;
using UnityEngine;

namespace Raksa.Game
{
    /// <summary>
    /// Pengatur utama sisi Unity: memuat diorama misi, mengatur kamera,
    /// menerima ketukan pemain, dan melaporkan pilihan ke React.
    ///
    /// Unity TIDAK menilai jawaban. Benar/salah hanya ditampilkan setelah React
    /// mengirim showFeedback (yaitu setelah server masuk fase pembahasan).
    /// </summary>
    public class GameRoot : MonoBehaviour
    {
        public RaksaBridge bridge;
        public CameraRig cameraRig;
        public QualityManager quality;
        public CharacterMover character;
        public DioramaRoot[] dioramas;

        [Tooltip("Kirim ringkasan kamera & isi diorama ke console browser saat misi dimuat. " +
                 "Berguna saat menyetel komposisi adegan; matikan untuk acara.")]
        public bool logDiagnostik = true;

        private DioramaRoot _active;
        private bool _interactionEnabled;
        private string _phase = "LOBBY";
        private bool _reducedMotion;
        private readonly List<Tappable> _mapped = new List<Tappable>(16);
        private Camera _cam;

        private void Awake()
        {
            if (bridge == null) bridge = RaksaBridge.Instance;
            if (bridge == null) bridge = FindAnyObjectByType<RaksaBridge>();
            if (cameraRig == null) cameraRig = FindAnyObjectByType<CameraRig>();
            if (quality == null) quality = FindAnyObjectByType<QualityManager>();
            _cam = cameraRig != null ? cameraRig.targetCamera : Camera.main;

            if (dioramas == null || dioramas.Length == 0)
            {
                dioramas = FindObjectsByType<DioramaRoot>(FindObjectsInactive.Include, FindObjectsSortMode.None);
            }
            for (int i = 0; i < dioramas.Length; i++)
            {
                if (dioramas[i] != null) dioramas[i].gameObject.SetActive(false);
            }
        }

        private void OnEnable()
        {
            if (bridge != null) bridge.OnMessage += Handle;
        }

        private void OnDisable()
        {
            if (bridge != null) bridge.OnMessage -= Handle;
        }

        // ------------------------------------------------------------ pesan

        private void Handle(InboundMessage msg)
        {
            switch (msg.type)
            {
                case "initialize":
                    _reducedMotion = msg.reducedMotion;
                    if (quality != null) quality.Configure(msg.quality, msg.maxDpr);
                    if (cameraRig != null) cameraRig.SetReducedMotion(_reducedMotion);
                    if (character != null) character.SetReducedMotion(_reducedMotion);
                    break;

                case "setQuality":
                    if (quality != null) quality.Configure(msg.quality, msg.maxDpr);
                    break;

                case "setReducedMotion":
                    _reducedMotion = msg.reducedMotion;
                    if (cameraRig != null) cameraRig.SetReducedMotion(_reducedMotion);
                    if (character != null) character.SetReducedMotion(_reducedMotion);
                    ApplyReducedMotionToTappables();
                    break;

                case "setPlayerAppearance":
                    if (character != null && msg.look != null) character.ApplyLook(msg.look);
                    break;

                case "loadMission":
                    LoadMission(msg);
                    break;

                case "setPhase":
                    _phase = msg.phase ?? _phase;
                    RefreshInteractable();
                    break;

                case "setInteractionEnabled":
                    _interactionEnabled = msg.enabled;
                    RefreshInteractable();
                    break;

                case "restoreSelections":
                    RestoreSelections(msg);
                    break;

                case "showFeedback":
                    ShowFeedback(msg);
                    break;

                case "setCameraView":
                    if (cameraRig != null && cameraRig.HasView(msg.view))
                    {
                        cameraRig.GoTo(msg.view, false);
                        bridge.SendCameraView(msg.view);
                    }
                    break;
            }
        }

        private void LoadMission(InboundMessage msg)
        {
            DioramaRoot next = null;
            for (int i = 0; i < dioramas.Length; i++)
            {
                var d = dioramas[i];
                if (d != null && d.sceneKey == msg.scene) { next = d; break; }
            }

            if (next == null)
            {
                bridge.SendError("scene-gagal", "diorama tidak ditemukan untuk scene: " + msg.scene, msg.missionId, msg.roundIndex);
                return;
            }

            if (_active != null && _active != next)
            {
                _active.HideAllMarkers();
                _active.gameObject.SetActive(false);
            }
            _active = next;
            _active.gameObject.SetActive(true);
            _active.Reindex();
            _active.HideAllMarkers();

            // Petakan objek dari data misi ke Tappable di diorama.
            _mapped.Clear();
            int nomor = 1;
            if (msg.objects != null)
            {
                for (int i = 0; i < msg.objects.Length; i++)
                {
                    var o = msg.objects[i];
                    if (o == null) continue;
                    string anchor = string.IsNullOrEmpty(o.anchor) ? (o.stepId + ":" + o.optionId) : o.anchor;
                    var t = _active.Find(anchor);
                    if (t == null)
                    {
                        // Objek ada di data tetapi tidak ada di diorama: laporkan, jangan diam-diam.
                        bridge.SendError("objek-tidak-dikenal", "anchor tidak ada di diorama: " + anchor, msg.missionId, msg.roundIndex);
                        continue;
                    }
                    t.Configure(o, nomor++);
                    t.SetReducedMotion(_reducedMotion);
                    _mapped.Add(t);
                }
            }

            // Ukur diorama yang aktif lalu serahkan ke kamera, supaya framing
            // dihitung dari geometri nyata - bukan dari angka tetap yang harus
            // ditebak per diorama.
            if (cameraRig != null)
            {
                cameraRig.UseViews(_active.cameraViews);
                Bounds b;
                if (HitungBounds(_active, out b)) cameraRig.SetFitBounds(b);
                else cameraRig.ClearFitBounds();
            }

            // Karakter berpindah otomatis; pemain tidak perlu berjalan manual.
            if (character != null) character.MoveTo(_active.characterEntry, _active.characterStand);

            _interactionEnabled = false;
            RefreshInteractable();

            if (logDiagnostik) LaporkanDiagnostik(msg.missionId);

            // Diorama sudah aktif & siap: beri tahu React supaya timer adil.
            bridge.SendMissionReady(msg.missionId, msg.roundIndex);
        }

        private void RestoreSelections(InboundMessage msg)
        {
            if (_active == null || msg.selections == null) return;
            for (int i = 0; i < _mapped.Count; i++) _mapped[i].SetSelected(false, false);

            for (int s = 0; s < msg.selections.Length; s++)
            {
                var sel = msg.selections[s];
                if (sel == null || string.IsNullOrEmpty(sel.stepId)) continue;

                if (sel.optionIds != null)
                {
                    for (int k = 0; k < sel.optionIds.Length; k++)
                    {
                        var t = _active.Find(sel.stepId + ":" + sel.optionIds[k]);
                        if (t != null) t.SetSelected(true, false);
                    }
                }
                if (sel.assign != null)
                {
                    for (int k = 0; k < sel.assign.Length; k++)
                    {
                        var pair = sel.assign[k];
                        if (pair == null || string.IsNullOrEmpty(pair.itemId)) continue;
                        var t = _active.Find(sel.stepId + ":" + pair.itemId);
                        // Item yang sudah punya bucket dianggap sudah dijawab.
                        if (t != null) t.SetSelected(!string.IsNullOrEmpty(pair.bucketId), false);
                    }
                }
            }
        }

        private void ShowFeedback(InboundMessage msg)
        {
            if (character != null) character.React(msg.kind);
            if (string.IsNullOrEmpty(msg.stepId) || string.IsNullOrEmpty(msg.optionId)) return;
            if (_active == null) return;
            var t = _active.Find(msg.stepId + ":" + msg.optionId);
            if (t != null) t.PlayTapResponse();
        }

        /// <summary>Kotak pembatas seluruh renderer aktif di satu diorama.</summary>
        private static bool HitungBounds(DioramaRoot d, out Bounds hasil)
        {
            hasil = new Bounds();
            if (d == null) return false;
            var rs = d.GetComponentsInChildren<Renderer>(false);
            bool punya = false;
            for (int i = 0; i < rs.Length; i++)
            {
                if (rs[i] == null || !rs[i].enabled) continue;
                if (!punya) { hasil = rs[i].bounds; punya = true; }
                else hasil.Encapsulate(rs[i].bounds);
            }
            return punya;
        }

        /// <summary>
        /// Ringkasan keadaan render saat misi dimuat: kamera, rasio canvas, dan
        /// kotak pembatas seluruh renderer di diorama aktif. Dipakai untuk
        /// memastikan diorama benar-benar masuk frame.
        /// </summary>
        private void LaporkanDiagnostik(string missionId)
        {
            var cam = _cam != null ? _cam : (cameraRig != null ? cameraRig.targetCamera : Camera.main);
            if (_active == null)
            {
                RaksaBridge.Log("diag " + missionId + ": tidak ada diorama aktif");
                return;
            }

            var rs = _active.GetComponentsInChildren<Renderer>(false);
            Bounds b;
            bool punya = HitungBounds(_active, out b);

            string camInfo = cam == null
                ? "kamera=NULL"
                : "kamera pos=" + cam.transform.position.ToString("F1") +
                  " arah=" + cam.transform.forward.ToString("F2") +
                  " fov=" + cam.fieldOfView.ToString("F0") +
                  " aspect=" + cam.aspect.ToString("F2") +
                  " clear=" + cam.clearFlags + " bg=" + cam.backgroundColor +
                  " aktif=" + cam.isActiveAndEnabled;

            string viewInfo = "views=" + (_active.cameraViews == null ? 0 : _active.cameraViews.Length);
            if (_active.cameraViews != null && _active.cameraViews.Length > 0 && _active.cameraViews[0] != null)
            {
                var v0 = _active.cameraViews[0];
                viewInfo += " v0.id=" + v0.id + " v0.pos=" + v0.position.ToString("F1") +
                            " v0.lookAt=" + v0.lookAt.ToString("F1") + " v0.fov=" + v0.fieldOfView.ToString("F0");
            }

            string boundsInfo = punya
                ? "renderer=" + rs.Length + " bounds pusat=" + b.center.ToString("F1") + " ukuran=" + b.size.ToString("F1")
                : "renderer=" + rs.Length + " (tidak ada bounds)";

            RaksaBridge.Log("diag " + missionId + " diorama=" + _active.sceneKey +
                            " aktif=" + _active.gameObject.activeInHierarchy +
                            " | " + camInfo + " | " + viewInfo + " | " + boundsInfo);
        }

        private void RefreshInteractable()
        {
            bool boleh = _interactionEnabled && (_phase == "ACTIVE" || _phase == "TUTORIAL");
            for (int i = 0; i < _mapped.Count; i++)
            {
                if (_mapped[i] != null) _mapped[i].SetInteractable(boleh);
            }
        }

        private void ApplyReducedMotionToTappables()
        {
            for (int i = 0; i < _mapped.Count; i++)
            {
                if (_mapped[i] != null) _mapped[i].SetReducedMotion(_reducedMotion);
            }
        }

        // ------------------------------------------------------------ ketukan

        private void Update()
        {
            if (!_interactionEnabled || _active == null) return;
            if (!(_phase == "ACTIVE" || _phase == "TUTORIAL")) return;

            Vector3 screenPos;
            if (Input.touchCount > 0)
            {
                var touch = Input.GetTouch(0);
                if (touch.phase != TouchPhase.Began) return;
                screenPos = touch.position;
            }
            else if (Input.GetMouseButtonDown(0))
            {
                screenPos = Input.mousePosition;
            }
            else
            {
                return;
            }

            if (_cam == null) _cam = cameraRig != null ? cameraRig.targetCamera : Camera.main;
            if (_cam == null) return;

            RaycastHit hit;
            var ray = _cam.ScreenPointToRay(screenPos);
            if (!Physics.Raycast(ray, out hit, 200f)) return;

            var t = hit.collider.GetComponentInParent<Tappable>();
            if (t == null) return;

            Tap(t);
        }

        private void Tap(Tappable t)
        {
            t.PlayTapResponse();

            if (t.multi)
            {
                bool added = !t.Selected;
                t.SetSelected(added, true);
                bridge.SendEvidenceToggled(t.stepId, t.optionId, added);
                bridge.SendSfx(added ? "bukti" : "pilih");
            }
            else
            {
                // Pilihan tunggal: hanya satu objek aktif per langkah.
                for (int i = 0; i < _mapped.Count; i++)
                {
                    var other = _mapped[i];
                    if (other != null && other != t && other.stepId == t.stepId) other.SetSelected(false, false);
                }
                t.SetSelected(true, true);
                bridge.SendObjectSelected(t.stepId, t.optionId, null);
                bridge.SendSfx("pilih");
            }
        }
    }
}
