using System;
using System.Collections.Generic;
using System.IO;
using Raksa.Bridge;
using Raksa.Game;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Raksa.EditorTools
{
    /// <summary>
    /// Membuat SELURUH isi Unity untuk RAKSA GAME secara prosedural:
    /// material, prefab, satu scene berisi 10 diorama, dan objek yang dapat diketuk.
    ///
    /// Sumber data: Assets/Editor/Generated/raksa-missions.json (dihasilkan dari
    /// shared/missions.ts). Generator TIDAK pernah memuat kunci jawaban - hanya
    /// id, label, jenis, dan posisi hotspot.
    ///
    /// Menu   : Raksa &gt; 2. Generate Diorama
    /// CLI    : unity/build.sh --generate-only (-executeMethod GenerateFromCommandLine)
    ///
    /// Semua diorama berada dalam satu scene dan dimatikan; GameRoot menyalakan
    /// satu diorama sesuai pesan loadMission dari React.
    /// </summary>
    public static partial class RaksaSceneGenerator
    {
        private const string MissionsJsonPath = "Assets/Editor/Generated/raksa-missions.json";
        private const string MaterialDir = "Assets/Materials";
        private const string PrefabDir = "Assets/Prefabs";
        private const string SceneDir = "Assets/Scenes";

        /// <summary>Jarak antar pusat diorama dalam satu scene.</summary>
        private const float DioramaSpacing = 40f;

        /// <summary>Radius alas tanah membulat. Semua isi cerita harus di dalamnya.</summary>
        private const float PlateRadius = 4.1f;

        private const float ViewFov = 40f;

        /// <summary>Diameter cincin penanda (terlihat) di satuan dunia.</summary>
        private const float MarkerDiameter = 1.15f;

        /// <summary>
        /// Ukuran minimum kotak sentuh. Tinggi pandang kamera = 2*16*tan(20) = 11.6
        /// satuan, jadi 1.7 satuan &gt;= 44 px pada kanvas setinggi 300 px ke atas.
        /// </summary>
        private const float MinTapSize = 1.7f;

        /// <summary>Jarak minimum antar penanda dalam bidang layar (cincin 1.15).</summary>
        private const float MinGap = 1.75f;

        private static readonly string[] SceneKeys = new string[]
        {
            "parkiran", "bengkel", "ruko", "proyek", "kantor",
            "pelabuhan", "gudang", "gudang-forklift", "kantor-hitung", "kota-banjir"
        };

        // ------------------------------------------------------ geometri pandang

        /// <summary>Posisi kamera "default" relatif titik pandang (isometrik tetap).</summary>
        private static Vector3 ViewOffset { get { return new Vector3(9.7f, 7.7f, -10.1f); } }

        /// <summary>Titik pandang kamera relatif pusat diorama.</summary>
        private static Vector3 LookLocal { get { return new Vector3(0f, 1.3f, 0f); } }

        private static Vector3 ViewFwd { get { return Vector3.Normalize(-ViewOffset); } }

        /// <summary>Arah "kanan layar" di dunia; dipakai menata penanda agar tidak bertumpuk.</summary>
        private static Vector3 ViewRight { get { return Vector3.Normalize(Vector3.Cross(Vector3.up, ViewFwd)); } }

        /// <summary>Arah "atas layar" di dunia.</summary>
        private static Vector3 ViewUp { get { return Vector3.Normalize(Vector3.Cross(ViewFwd, ViewRight)); } }

        /// <summary>Yaw agar sisi depan objek (-Z) menghadap kamera default.</summary>
        private static float FaceYaw
        {
            get { return Mathf.Atan2(ViewOffset.x, ViewOffset.z) * Mathf.Rad2Deg - 180f; }
        }

        // ---------------------------------------------------------- data misi

        [Serializable]
        public class MissionSetJson
        {
            public MissionJson[] missions;
        }

        [Serializable]
        public class MissionJson
        {
            public string id;
            public string scene;
            public string[] cameraViews;
            public StepJson[] steps;
        }

        [Serializable]
        public class StepJson
        {
            public string id;
            public ObjectJson[] objects;
        }

        [Serializable]
        public class ObjectJson
        {
            public string stepId;
            public string optionId;
            public string label;
            public string kind;
            public string anchor;
            public bool multi;
            public HotspotJson hotspot;
        }

        [Serializable]
        public class HotspotJson
        {
            // -1 = tidak ada hotspot (field absen di JSON).
            public float x = -1f;
            public float y = -1f;
        }

        private class TapMeta
        {
            public string label;
            public string kind;
            public bool multi;
            public int number;
            public bool hasHotspot;
            public float hx;
            public float hy;
        }

        /// <summary>Satu diorama yang sedang dibangun.</summary>
        private class Dio
        {
            public DioramaRoot root;
            public Transform t;
            public Vector3 center;
            public string key;
            /// <summary>Arah rata-rata ke semua sudut pandang diorama ini (kompromi hadap penanda).</summary>
            public Vector3 aim;
            /// <summary>Yaw agar sisi depan (-Z) objek tap menghadap arah aim.</summary>
            public float faceYaw;
        }

        private class Env
        {
            public RaksaBridge bridge;
            public CameraRig rig;
            public GameRoot game;
            public QualityManager quality;
            public CharacterMover character;
            public Light sun;
        }

        // missionId|anchor -> meta
        private static Dictionary<string, TapMeta> _meta;
        // missionId -> daftar anchor (urutan sama dengan objects yang dikirim React)
        private static Dictionary<string, List<string>> _anchors;
        // missionId -> sceneKey
        private static Dictionary<string, string> _sceneOf;
        // sceneKey -> daftar id cameraView (default selalu pertama)
        private static Dictionary<string, List<string>> _views;

        // ------------------------------------------------------------- entri

        [MenuItem("Raksa/2. Generate Diorama", false, 21)]
        public static void GenerateAllMenu()
        {
            if (Run()) Debug.Log("[Raksa] Diorama siap. Lanjut ke menu Raksa > 3. Build Web.");
            else Debug.LogError("[Raksa] Generate diorama GAGAL. Periksa pesan di atas.");
        }

        /// <summary>Dipakai RaksaBuildWeb bila scene belum ada.</summary>
        public static bool GenerateAll()
        {
            return Run();
        }

        /// <summary>-executeMethod Raksa.EditorTools.RaksaSceneGenerator.GenerateFromCommandLine</summary>
        public static void GenerateFromCommandLine()
        {
            bool ok = Run();
            EditorApplication.Exit(ok ? 0 : 1);
        }

        private static bool Run()
        {
            try
            {
                if (!LoadMissions()) return false;

                EnsureFolder(MaterialDir);
                EnsureFolder(PrefabDir);
                EnsureFolder(SceneDir);

                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

                if (!BuildMaterials()) return false;
                if (!BuildPrefabs()) return false;

                Env env = BuildEnvironment();

                List<DioramaRoot> dioramas = new List<DioramaRoot>(SceneKeys.Length);
                for (int i = 0; i < SceneKeys.Length; i++)
                {
                    Vector3 center = new Vector3((i % 5) * DioramaSpacing, 0f, (i / 5) * DioramaSpacing);
                    DioramaRoot d = BuildDiorama(SceneKeys[i], center);
                    if (d != null) dioramas.Add(d);
                }

                env.game.dioramas = dioramas.ToArray();

                // Kamera mulai pada pandangan diorama pertama supaya editor & lobi enak dilihat.
                env.rig.views = BuildViews(SceneKeys[0], Vector3.zero);
                if (env.rig.views.Length > 0 && env.rig.targetCamera != null)
                {
                    CameraRig.View v0 = env.rig.views[0];
                    env.rig.targetCamera.transform.position = v0.position;
                    env.rig.targetCamera.transform.rotation =
                        Quaternion.LookRotation(Vector3.Normalize(v0.lookAt - v0.position), Vector3.up);
                    env.rig.targetCamera.fieldOfView = v0.fieldOfView;
                }
                if (env.character != null && dioramas.Count > 0 && dioramas[0].characterStand != null)
                {
                    env.character.transform.position = dioramas[0].characterStand.position;
                }

                bool ok = Validate(dioramas);

                if (!EditorSceneManager.SaveScene(scene, RaksaBuildWeb.GameScenePath))
                {
                    Debug.LogError("[Raksa] gagal menyimpan scene: " + RaksaBuildWeb.GameScenePath);
                    return false;
                }

                RaksaBuildWeb.ApplySettings();
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();

                Debug.Log("[Raksa] Scene tersimpan: " + RaksaBuildWeb.GameScenePath +
                          " (" + dioramas.Count + " diorama, semua tidak aktif).");
                return ok;
            }
            catch (Exception e)
            {
                Debug.LogError("[Raksa] generator gagal: " + e);
                return false;
            }
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            string parent = Path.GetDirectoryName(path);
            if (parent != null) parent = parent.Replace('\\', '/');
            string name = Path.GetFileName(path);
            if (string.IsNullOrEmpty(parent) || string.IsNullOrEmpty(name)) return;
            Directory.CreateDirectory(path);
            AssetDatabase.Refresh();
            if (!AssetDatabase.IsValidFolder(path)) AssetDatabase.CreateFolder(parent, name);
        }

        // -------------------------------------------------------- baca JSON

        private static bool LoadMissions()
        {
            if (!File.Exists(MissionsJsonPath))
            {
                Debug.LogError("[Raksa] data misi tidak ada: " + MissionsJsonPath + ". Jalankan: npm run gen:unity");
                return false;
            }

            MissionSetJson set = JsonUtility.FromJson<MissionSetJson>(File.ReadAllText(MissionsJsonPath));
            if (set == null || set.missions == null || set.missions.Length == 0)
            {
                Debug.LogError("[Raksa] data misi tidak dapat dibaca: " + MissionsJsonPath);
                return false;
            }

            _meta = new Dictionary<string, TapMeta>(128);
            _anchors = new Dictionary<string, List<string>>(16);
            _sceneOf = new Dictionary<string, string>(16);
            _views = new Dictionary<string, List<string>>(16);

            for (int i = 0; i < set.missions.Length; i++)
            {
                MissionJson m = set.missions[i];
                if (m == null || string.IsNullOrEmpty(m.id) || string.IsNullOrEmpty(m.scene)) continue;

                List<string> daftar = new List<string>(12);
                int nomor = 1;
                if (m.steps != null)
                {
                    for (int s = 0; s < m.steps.Length; s++)
                    {
                        StepJson step = m.steps[s];
                        if (step == null || step.objects == null) continue;
                        for (int o = 0; o < step.objects.Length; o++)
                        {
                            ObjectJson obj = step.objects[o];
                            if (obj == null || string.IsNullOrEmpty(obj.stepId) || string.IsNullOrEmpty(obj.optionId)) continue;
                            string anchor = string.IsNullOrEmpty(obj.anchor) ? (obj.stepId + ":" + obj.optionId) : obj.anchor;

                            TapMeta meta = new TapMeta();
                            meta.label = obj.label;
                            meta.kind = string.IsNullOrEmpty(obj.kind) ? "bukti" : obj.kind;
                            meta.multi = obj.multi;
                            // Nomor penanda mengikuti urutan objek dalam misi, sama dengan
                            // penomoran GameRoot saat loadMission.
                            meta.number = nomor;
                            nomor++;
                            if (obj.hotspot != null && obj.hotspot.x > 0f && obj.hotspot.y > 0f)
                            {
                                meta.hasHotspot = true;
                                meta.hx = obj.hotspot.x;
                                meta.hy = obj.hotspot.y;
                            }
                            _meta[m.id + "|" + anchor] = meta;
                            daftar.Add(anchor);
                        }
                    }
                }

                _anchors[m.id] = daftar;
                _sceneOf[m.id] = m.scene;

                List<string> views;
                if (!_views.TryGetValue(m.scene, out views))
                {
                    views = new List<string>(5);
                    views.Add("default");
                    _views[m.scene] = views;
                }
                if (m.cameraViews != null)
                {
                    for (int v = 0; v < m.cameraViews.Length; v++)
                    {
                        string id = m.cameraViews[v];
                        if (!string.IsNullOrEmpty(id) && !views.Contains(id)) views.Add(id);
                    }
                }
            }

            Debug.Log("[Raksa] data misi dibaca: " + _anchors.Count + " misi, " + _meta.Count + " objek.");
            return _meta.Count > 0;
        }

        private static TapMeta Meta(string mission, string anchor)
        {
            TapMeta meta;
            if (_meta != null && _meta.TryGetValue(mission + "|" + anchor, out meta)) return meta;
            Debug.LogError("[Raksa] anchor tidak ada di data misi: " + mission + " / " + anchor);
            return null;
        }

        /// <summary>Anchor satu langkah, urut sesuai data misi.</summary>
        private static string[] Anchors(string mission, string stepId)
        {
            List<string> all;
            if (_anchors == null || !_anchors.TryGetValue(mission, out all))
            {
                Debug.LogError("[Raksa] misi tidak dikenal: " + mission);
                return new string[0];
            }
            string prefix = stepId + ":";
            List<string> hasil = new List<string>(all.Count);
            for (int i = 0; i < all.Count; i++)
            {
                if (all[i].StartsWith(prefix)) hasil.Add(all[i]);
            }
            if (hasil.Count == 0) Debug.LogWarning("[Raksa] langkah tanpa objek: " + mission + " / " + stepId);
            return hasil.ToArray();
        }

        // ------------------------------------------------------- objek tappable

        private static Tappable Tap(Dio d, string mission, string anchor, Vector3 local, string bodyKind, bool faceCamera)
        {
            TapMeta meta = Meta(mission, anchor);
            if (meta == null) return null;

            int pisah = anchor.IndexOf(':');
            if (pisah <= 0 || pisah == anchor.Length - 1)
            {
                Debug.LogError("[Raksa] anchor tidak sah: " + anchor);
                return null;
            }

            GameObject go = new GameObject(anchor);
            go.transform.SetParent(d.t, false);
            go.transform.localPosition = local;
            go.transform.localEulerAngles = new Vector3(0f, faceCamera ? d.faceYaw : 0f, 0f);

            GameObject bentuk = Node("bentuk", go.transform, Vector3.zero);
            TapBody(bentuk.transform, bodyKind);

            // Collider dipasang lebih dulu supaya RequireComponent pada Tappable
            // tidak perlu menambah collider sendiri.
            BoxCollider col = go.AddComponent<BoxCollider>();
            Tappable tap = go.AddComponent<Tappable>();
            tap.stepId = anchor.Substring(0, pisah);
            tap.optionId = anchor.Substring(pisah + 1);
            tap.label = meta.label;
            tap.kind = meta.kind;
            tap.multi = meta.multi;
            tap.markerNumber = meta.number;

            Vector3 markerLocal = faceCamera ? new Vector3(0f, 0f, -0.42f) : Vector3.zero;
            Transform marker = SpawnMarker(go.transform, markerLocal, meta.number);
            if (marker != null)
            {
                // Cincin & nomor menghadap arah pandang diorama (sisi +Z penanda).
                marker.rotation = Quaternion.LookRotation(d.aim, Vector3.up);
                tap.marker = marker;
                Transform hl = marker.Find("highlight");
                if (hl != null)
                {
                    hl.gameObject.SetActive(false);
                    tap.highlight = hl;
                }
            }

            tap.tintTargets = bentuk.GetComponentsInChildren<Renderer>(true);
            FitCollider(go, col, MinTapSize);
            return tap;
        }

        /// <summary>Kotak sentuh melingkupi bentuk + penanda, minimal MinTapSize.</summary>
        private static void FitCollider(GameObject root, BoxCollider col, float min)
        {
            Renderer[] rs = root.GetComponentsInChildren<Renderer>(true);
            Bounds b = new Bounds(root.transform.position, Vector3.zero);
            bool ada = false;
            for (int i = 0; i < rs.Length; i++)
            {
                if (rs[i] == null) continue;
                if (!ada) { b = rs[i].bounds; ada = true; }
                else b.Encapsulate(rs[i].bounds);
            }
            Vector3 size = ada ? b.size : Vector3.zero;
            col.center = ada ? root.transform.InverseTransformPoint(b.center) : Vector3.zero;
            col.size = new Vector3(
                Mathf.Max(size.x, min),
                Mathf.Max(size.y, min),
                Mathf.Max(size.z, min));
        }

        /// <summary>
        /// Satu baris objek pilihan. Arah baris memakai "kanan layar" (ViewRight)
        /// atau sumbu X dunia, supaya jarak antar penanda tetap terasa di layar HP.
        /// </summary>
        private static List<Tappable> TapRow(Dio d, string mission, string stepId, Vector3 baseLocal, Vector3 dir, float step, string bodyKind)
        {
            string[] anchors = Anchors(mission, stepId);
            List<Tappable> list = new List<Tappable>(anchors.Length);
            Vector3 unit = Vector3.Normalize(dir);
            for (int i = 0; i < anchors.Length; i++)
            {
                float t = (i - (anchors.Length - 1) * 0.5f) * step;
                Tappable tap = Tap(d, mission, anchors[i], baseLocal + unit * t, bodyKind, true);
                if (tap != null) list.Add(tap);
            }
            return list;
        }

        /// <summary>
        /// Geser penanda yang terlalu berdekatan di bidang layar. Hanya digeser
        /// mendatar (ViewRight) supaya tinggi objek tidak berubah.
        /// ponytail: O(n^2) untuk maksimal 9 penanda per misi - cukup.
        /// </summary>
        private static void Spread(Dio d, List<Tappable> grup, float minGap)
        {
            if (grup == null || grup.Count < 2) return;
            Vector3 right = ViewRight;
            Vector3 up = ViewUp;
            for (int pass = 0; pass < 8; pass++)
            {
                bool geser = false;
                for (int i = 0; i < grup.Count; i++)
                {
                    for (int j = i + 1; j < grup.Count; j++)
                    {
                        Tappable a = grup[i];
                        Tappable b = grup[j];
                        if (a == null || b == null) continue;
                        Vector3 delta = MarkerLocal(d, b) - MarkerLocal(d, a);
                        float dx = Vector3.Dot(delta, right);
                        float dy = Vector3.Dot(delta, up);
                        float jarak = Mathf.Sqrt(dx * dx + dy * dy);
                        if (jarak >= minGap) continue;
                        float dorong = (minGap - jarak) * 0.5f + 0.02f;
                        float arah = dx >= 0f ? 1f : -1f;
                        a.transform.localPosition = a.transform.localPosition - right * (dorong * arah);
                        b.transform.localPosition = b.transform.localPosition + right * (dorong * arah);
                        geser = true;
                    }
                }
                if (!geser) return;
            }
            Debug.LogWarning("[Raksa] penanda pada diorama " + d.key + " masih berdekatan setelah 8 penataan.");
        }

        private static Vector3 MarkerLocal(Dio d, Tappable tap)
        {
            Transform m = tap.marker != null ? tap.marker : tap.transform;
            return d.t.InverseTransformPoint(m.position);
        }

        /// <summary>
        /// Peta hotspot persen (x,y dari adegan 2D) ke koordinat lokal diorama:
        /// titik diproyeksikan balik dari bidang pandang kamera default pada
        /// jarak pusat diorama, lalu dijaga tetap di dalam alas.
        /// </summary>
        private static Vector3 HotspotLocal(float xPersen, float yPersen)
        {
            const float aspek = 0.72f; // kanvas HP portrait
            float jarak = ViewOffset.magnitude;
            float halfH = jarak * Mathf.Tan(ViewFov * 0.5f * Mathf.Deg2Rad);
            float halfW = halfH * aspek;
            float u = (xPersen / 50f) - 1f;
            float v = 1f - (yPersen / 50f);
            Vector3 camPos = LookLocal + ViewOffset;
            Vector3 p = camPos + ViewFwd * jarak + ViewRight * (u * halfW) + ViewUp * (v * halfH);

            // Jaga tinggi tetap wajar TANPA menggeser posisi di layar: titik
            // digeser sepanjang garis pandang (arah sama = piksel sama).
            p = SlideToHeight(camPos, p, 0.55f, 5.4f);

            // Bila masih di luar alas, tarik radial (ini memang sedikit menggeser layar).
            float r = Mathf.Sqrt(p.x * p.x + p.z * p.z);
            float max = PlateRadius - 0.2f;
            if (r > max && r > 0.001f)
            {
                float k = max / r;
                p = new Vector3(p.x * k, p.y, p.z * k);
            }
            return p;
        }

        private static Vector3 SlideToHeight(Vector3 camPos, Vector3 p, float min, float max)
        {
            float target = p.y;
            if (p.y < min) target = min;
            else if (p.y > max) target = max;
            else return p;
            float beda = p.y - camPos.y;
            if (Mathf.Abs(beda) < 0.001f) return p;
            float k = (target - camPos.y) / beda;
            if (k <= 0.01f) return p;
            return camPos + (p - camPos) * k;
        }

        // --------------------------------------------------------- lingkungan

        private static Env BuildEnvironment()
        {
            Env env = new Env();

            GameObject rigGo = new GameObject("CameraRig");
            env.rig = rigGo.AddComponent<CameraRig>();
            env.rig.moveSeconds = 0.55f;

            GameObject camGo = new GameObject("Kamera");
            camGo.transform.SetParent(rigGo.transform, false);
            camGo.tag = "MainCamera";
            Camera cam = camGo.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Hex("#FFF9E9");
            cam.fieldOfView = ViewFov;
            cam.nearClipPlane = 0.5f;
            cam.farClipPlane = 60f;
            cam.allowHDR = false;
            cam.allowMSAA = false;
            cam.useOcclusionCulling = false;
            env.rig.targetCamera = cam;

            GameObject sunGo = new GameObject("Matahari");
            sunGo.transform.localEulerAngles = new Vector3(46f, 38f, 0f);
            env.sun = sunGo.AddComponent<Light>();
            env.sun.type = LightType.Directional;
            env.sun.color = Hex("#FFF3DC");
            env.sun.intensity = 1.05f;
            env.sun.shadows = LightShadows.Hard;
            env.sun.shadowStrength = 0.45f;
            env.sun.shadowBias = 0.05f;

            // Cahaya lingkungan hangat + kabut sangat tipis supaya latar terasa lembut.
            RenderSettings.skybox = null;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = Hex("#D8E4D2");
            RenderSettings.ambientIntensity = 1f;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = Hex("#FFF9E9");
            RenderSettings.fogStartDistance = 20f;
            RenderSettings.fogEndDistance = 46f;

            GameObject bridgeGo = new GameObject("RaksaBridge");
            env.bridge = bridgeGo.AddComponent<RaksaBridge>();

            GameObject rootGo = new GameObject("GameRoot");
            env.game = rootGo.AddComponent<GameRoot>();
            env.quality = rootGo.AddComponent<QualityManager>();
            env.quality.targetFrameRate = 30;
            env.quality.maxRenderScale = 1.5f;
            env.quality.mainLight = env.sun;

            GameObject petugas = Spawn("petugas", null, Vector3.zero, FaceYaw, 1f);
            if (petugas != null) env.character = petugas.GetComponent<CharacterMover>();

            env.game.bridge = env.bridge;
            env.game.cameraRig = env.rig;
            env.game.quality = env.quality;
            env.game.character = env.character;

            return env;
        }

        private static CameraRig.View[] BuildViews(string sceneKey, Vector3 center)
        {
            List<string> ids;
            if (_views == null || !_views.TryGetValue(sceneKey, out ids) || ids == null || ids.Count == 0)
            {
                ids = new List<string>(1);
                ids.Add("default");
            }

            List<CameraRig.View> views = new List<CameraRig.View>(ids.Count);
            for (int i = 0; i < ids.Count; i++)
            {
                CameraRig.View v = new CameraRig.View();
                v.id = ids[i];
                v.fieldOfView = ViewFov;
                Vector3 look = center + LookLocal;
                Vector3 off;
                switch (ids[i])
                {
                    case "depan": off = new Vector3(0f, 6.4f, -14.6f); break;
                    case "kiri": off = new Vector3(-14.2f, 6.6f, -6.2f); break;
                    case "kanan": off = new Vector3(14.2f, 6.6f, -6.2f); break;
                    case "atas":
                        off = new Vector3(0.6f, 15.8f, -2.6f);
                        look = center + new Vector3(0f, 0.3f, 0f);
                        break;
                    default: off = ViewOffset; break;
                }
                v.lookAt = look;
                v.position = look + off;
                views.Add(v);
            }
            return views.ToArray();
        }

        // ------------------------------------------------------------ diorama

        private static DioramaRoot BuildDiorama(string key, Vector3 center)
        {
            GameObject go = new GameObject("Diorama-" + key);
            go.transform.position = center;
            DioramaRoot root = go.AddComponent<DioramaRoot>();
            root.sceneKey = key;

            Dio d = new Dio();
            d.root = root;
            d.t = go.transform;
            d.center = center;
            d.key = key;

            // Sudut pandang dulu: penanda & kartu diarahkan ke rata-rata semua
            // sudut pandang diorama ini, supaya tetap terbaca saat pemain menekan
            // "Depan" / "Sisi kiri" / "Atas" (tidak ada skrip billboard di runtime).
            root.cameraViews = BuildViews(key, center);
            d.aim = AimDirection(root.cameraViews, center);
            d.faceYaw = Mathf.Atan2(-d.aim.x, -d.aim.z) * Mathf.Rad2Deg;

            switch (key)
            {
                case "parkiran": DioParkiran(d); break;
                case "bengkel": DioBengkel(d); break;
                case "ruko": DioRuko(d); break;
                case "proyek": DioProyek(d); break;
                case "kantor": DioKantor(d); break;
                case "pelabuhan": DioPelabuhan(d); break;
                case "gudang": DioGudang(d); break;
                case "gudang-forklift": DioGudangForklift(d); break;
                case "kantor-hitung": DioKantorHitung(d); break;
                case "kota-banjir": DioKotaBanjir(d); break;
                default:
                    Debug.LogError("[Raksa] sceneKey tidak dikenal: " + key);
                    break;
            }

            // Maskot, papan lokasi, dan petugas berbaris di bagian bawah layar
            // (arah "kanan layar") supaya tidak menutupi penanda pilihan.
            Spawn("raki", d.t, new Vector3(2.09f, 0f, -2.6f), FaceYaw, 1f);
            Spawn("papan-nama", d.t, new Vector3(-3.4f, 0f, 1.9f), FaceYaw, 1f);

            root.characterEntry = Node("characterEntry", d.t, new Vector3(-1.01f, 0f, -5.58f)).transform;
            root.characterStand = Node("characterStand", d.t, new Vector3(0.72f, 0f, -3.92f)).transform;
            root.characterStand.localEulerAngles = new Vector3(0f, FaceYaw, 0f);

            go.SetActive(false);
            return root;
        }

        /// <summary>Rata-rata arah dari pusat diorama ke setiap posisi kamera.</summary>
        private static Vector3 AimDirection(CameraRig.View[] views, Vector3 center)
        {
            Vector3 look = center + LookLocal;
            Vector3 sum = Vector3.zero;
            if (views != null)
            {
                for (int i = 0; i < views.Length; i++)
                {
                    if (views[i] == null) continue;
                    Vector3 dir = views[i].position - look;
                    if (dir.sqrMagnitude > 0.0001f) sum = sum + Vector3.Normalize(dir);
                }
            }
            if (sum.sqrMagnitude < 0.0001f) return ViewFwd * -1f;
            return Vector3.Normalize(sum);
        }

        /// <summary>Misi 1 - mobil tersenggol di parkiran kota.</summary>
        private static void DioParkiran(Dio d)
        {
            Ground(d, "aspal");
            for (int i = 0; i < 4; i++)
            {
                Box("marka-" + i, d.t, new Vector3(-2.55f + i * 1.7f, 0.02f, 1.7f), new Vector3(0.09f, 0.03f, 2.4f), "putih", 0f);
            }
            Box("marka-batas", d.t, new Vector3(-0.85f, 0.02f, 2.9f), new Vector3(5.2f, 0.03f, 0.09f), "putih", 0f);

            Spawn("gedung-kantor", d.t, new Vector3(2.4f, 0f, 3.2f), FaceYaw + 12f, 1f);
            Spawn("ruko", d.t, new Vector3(-2.6f, 0f, 3.3f), FaceYaw - 10f, 0.95f);

            GameObject mobil = Spawn("mobil", d.t, new Vector3(-1.7f, 0f, 1.7f), FaceYaw + 6f, 1f);
            if (mobil != null)
            {
                // Penyok di bagian depan kiri; jadi pusat cerita misi 1.
                Box("penyok", mobil.transform, new Vector3(-0.76f, 0.55f, -1.1f), new Vector3(0.14f, 0.34f, 0.7f), "karat", 0f);
            }
            Spawn("mobil", d.t, new Vector3(1.05f, 0f, 1.75f), FaceYaw - 4f, 1f);
            Spawn("lampu-jalan", d.t, new Vector3(3.5f, 0f, 0.2f), FaceYaw, 1f);
            Spawn("pohon", d.t, new Vector3(-3.6f, 0f, 0.3f), 0f, 1f);
            Spawn("pohon", d.t, new Vector3(3.4f, 0f, 3.0f), 40f, 0.85f);
            Kerucut(d.t, new Vector3(-3.0f, 0f, -1.0f));
            Kerucut(d.t, new Vector3(2.0f, 0f, -0.2f));

            List<Tappable> grup = TapRow(d, "m01-parkir", "s1", new Vector3(0f, 1.3f, -1.5f), ViewRight, 1.9f, "papan");
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 2 - memilih bukti foto di bengkel mitra.</summary>
        private static void DioBengkel(Dio d)
        {
            Ground(d, "beton");
            Box("dinding-belakang", d.t, new Vector3(0f, 1.7f, 3.6f), new Vector3(8.0f, 3.4f, 0.25f), "krem", 0f);
            Box("dinding-kiri", d.t, new Vector3(-3.7f, 1.7f, 1.2f), new Vector3(0.25f, 3.4f, 5.0f), "krem", 0f);
            Box("atap", d.t, new Vector3(0f, 3.5f, 1.4f), new Vector3(8.2f, 0.22f, 4.8f), "kuning-tua", 0f);
            Cyl("tiang-kanan", d.t, new Vector3(3.5f, 1.7f, -0.9f), 0.18f, 3.4f, "aspal");
            Cyl("tiang-kiri", d.t, new Vector3(-3.5f, 1.7f, -0.9f), 0.18f, 3.4f, "aspal");
            Box("garis-lantai", d.t, new Vector3(0f, 0.02f, 0.4f), new Vector3(6.4f, 0.03f, 0.1f), "kuning", 0f);

            // Mobil di atas dongkrak: kerusakan depan kiri.
            GameObject mobil = Spawn("mobil", d.t, new Vector3(-1.0f, 0.42f, 2.2f), FaceYaw + 178f, 1f);
            if (mobil != null) Box("penyok", mobil.transform, new Vector3(-0.76f, 0.55f, -1.1f), new Vector3(0.14f, 0.36f, 0.8f), "karat", 0f);
            Box("dongkrak-kiri", d.t, new Vector3(-1.8f, 0.2f, 2.2f), new Vector3(0.5f, 0.42f, 0.5f), "aspal", 0f);
            Box("dongkrak-kanan", d.t, new Vector3(-0.2f, 0.2f, 2.2f), new Vector3(0.5f, 0.42f, 0.5f), "aspal", 0f);

            Spawn("meja-kerja", d.t, new Vector3(2.5f, 0f, 2.6f), FaceYaw + 8f, 1f);
            Spawn("peti", d.t, new Vector3(3.2f, 0f, 0.9f), 20f, 1f);
            CylE("ban-1", d.t, new Vector3(-3.0f, 0.32f, 2.6f), 0.64f, 0.26f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("ban-2", d.t, new Vector3(-3.0f, 0.62f, 2.6f), 0.64f, 0.26f, "tinta", new Vector3(0f, 0f, 90f));
            OrangSederhana(d.t, new Vector3(1.3f, 0f, 1.1f), FaceYaw - 20f, "kuning", false);

            // 6 foto: 3 di meja rendah, 3 di papan dinding (beda tinggi = jarak layar cukup).
            string[] anchors = Anchors("m02-detektif-penyok", "bukti");
            List<Tappable> grup = new List<Tappable>(anchors.Length);
            for (int i = 0; i < anchors.Length; i++)
            {
                int kolom = i % 3;
                int baris = i / 3;
                Vector3 pos = new Vector3(-2.3f + kolom * 2.3f, baris == 0 ? 1.2f : 2.95f, -0.9f + baris * 0.9f);
                Tappable tap = Tap(d, "m02-detektif-penyok", anchors[i], pos, "foto", true);
                if (tap != null) grup.Add(tap);
            }
            MejaPanjang(d.t, new Vector3(0f, 0f, -1.1f), 5.4f, FaceYaw);
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 3 - menyiapkan berkas laporan awal di ruko.</summary>
        private static void DioRuko(Dio d)
        {
            Ground(d, "beton");
            Spawn("ruko", d.t, new Vector3(-0.4f, 0f, 3.2f), FaceYaw, 1.1f);
            // Jejak kebakaran yang sudah ditangani.
            Box("noda-asap", d.t, new Vector3(-0.4f, 2.6f, 1.85f), new Vector3(1.6f, 1.2f, 0.06f), "aspal", 0f);
            Box("papan-tutup", d.t, new Vector3(0.3f, 1.0f, 1.9f), new Vector3(1.4f, 1.6f, 0.08f), "cokelat", 0f);
            Spawn("pohon", d.t, new Vector3(3.3f, 0f, 2.8f), 15f, 0.9f);
            Spawn("lampu-jalan", d.t, new Vector3(-3.6f, 0f, -0.4f), FaceYaw, 1f);
            Kerucut(d.t, new Vector3(-1.9f, 0f, 1.2f));
            Kerucut(d.t, new Vector3(1.1f, 0f, 1.2f));
            Pagar(d.t, new Vector3(-2.6f, 0f, 0.6f), new Vector3(2.2f, 0f, 0.6f), 5);

            // Meja berkas + rak dokumen.
            MejaPanjang(d.t, new Vector3(0f, 0f, -1.4f), 5.2f, FaceYaw);
            Box("folder", d.t, new Vector3(1.9f, 0.85f, -2.2f), new Vector3(0.9f, 0.16f, 0.66f), "hijau", FaceYaw);
            Box("folder-label", d.t, new Vector3(1.9f, 0.94f, -2.2f), new Vector3(0.6f, 0.04f, 0.3f), "krem", FaceYaw);

            string[] anchors = Anchors("m03-berkas-ruko", "berkas");
            List<Tappable> grup = new List<Tappable>(anchors.Length);
            for (int i = 0; i < anchors.Length; i++)
            {
                int kolom = i % 3;
                int baris = i / 3;
                Vector3 pos = baris == 0
                    ? new Vector3(-2.3f + kolom * 2.3f, 1.2f, -1.3f)
                    : new Vector3(-2.3f + kolom * 2.3f, 2.95f, 0.2f);
                Tappable tap = Tap(d, "m03-berkas-ruko", anchors[i], pos, "dokumen", true);
                if (tap != null) grup.Add(tap);
            }
            Box("papan-berkas", d.t, new Vector3(0f, 2.9f, 0.45f), new Vector3(7.0f, 1.7f, 0.12f), "krem", 0f);
            Box("rangka-papan", d.t, new Vector3(0f, 2.9f, 0.52f), new Vector3(7.2f, 1.86f, 0.1f), "hijau", 0f);
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 4 - excavator miring di proyek; 7 hotspot dari data misi.</summary>
        private static void DioProyek(Dio d)
        {
            Ground(d, "cokelat");
            Box("jalan", d.t, new Vector3(0f, 0.02f, -0.4f), new Vector3(8.0f, 0.06f, 2.8f), "aspal", 14f);
            Box("galian", d.t, new Vector3(-0.3f, 0.01f, 1.6f), new Vector3(3.0f, 0.05f, 1.6f), "tinta", 10f);

            Vector3 pPosisi = HotspotLocal(34f, 72f);
            Vector3 pSeri = HotspotLocal(57f, 47f);
            Vector3 pRusak = HotspotLocal(71f, 34f);
            Vector3 pOperator = HotspotLocal(16f, 55f);
            Vector3 pSpanduk = HotspotLocal(86f, 63f);
            Vector3 pWarung = HotspotLocal(91f, 82f);
            Vector3 pAwan = HotspotLocal(22f, 15f);

            // Unit tergelincir: badan mengikuti hotspot "posisi", miring ke kiri.
            GameObject exc = Spawn("excavator", d.t, new Vector3(pPosisi.x, 0f, pPosisi.z), FaceYaw + 24f, 1f);
            if (exc != null) exc.transform.localEulerAngles = new Vector3(0f, FaceYaw + 24f, -13f);

            // Objek pendukung diletakkan tepat di balik penanda hotspot-nya.
            Box("plat-seri-besar", d.t, new Vector3(pSeri.x, pSeri.y, pSeri.z) + ViewFwd * 0.3f, new Vector3(0.5f, 0.3f, 0.05f), "krem", FaceYaw);
            Box("bagian-rusak", d.t, new Vector3(pRusak.x, pRusak.y, pRusak.z) + ViewFwd * 0.3f, new Vector3(0.6f, 0.34f, 0.3f), "karat", FaceYaw);
            OrangSederhana(d.t, new Vector3(pOperator.x, 0f, pOperator.z), FaceYaw, "kuning", true);

            GameObject spanduk = Node("spanduk", d.t, new Vector3(pSpanduk.x, 0f, pSpanduk.z) + ViewFwd * 0.35f);
            Cyl("tiang-kiri", spanduk.transform, new Vector3(-0.8f, 0.8f, 0f), 0.1f, 1.6f, "cokelat");
            Cyl("tiang-kanan", spanduk.transform, new Vector3(0.8f, 0.8f, 0f), 0.1f, 1.6f, "cokelat");
            Box("kain", spanduk.transform, new Vector3(0f, 1.3f, 0f), new Vector3(1.9f, 0.9f, 0.06f), "kuning", 0f);
            Box("garis-kain", spanduk.transform, new Vector3(0f, 1.3f, -0.05f), new Vector3(1.5f, 0.1f, 0.03f), "hijau", 0f);
            spanduk.transform.localEulerAngles = new Vector3(0f, FaceYaw, 0f);

            GameObject warung = Node("warung", d.t, new Vector3(pWarung.x, 0f, pWarung.z));
            warung.transform.localEulerAngles = new Vector3(0f, FaceYaw, 0f);
            Box("meja", warung.transform, new Vector3(0f, 0.6f, 0f), new Vector3(1.5f, 0.12f, 0.8f), "cokelat", 0f);
            Box("kaki-kiri", warung.transform, new Vector3(-0.6f, 0.3f, 0f), new Vector3(0.1f, 0.6f, 0.1f), "cokelat", 0f);
            Box("kaki-kanan", warung.transform, new Vector3(0.6f, 0.3f, 0f), new Vector3(0.1f, 0.6f, 0.1f), "cokelat", 0f);
            Box("tenda", warung.transform, new Vector3(0f, 1.5f, 0f), new Vector3(1.8f, 0.1f, 1.2f), "karat", 0f);
            Cyl("tiang-tenda", warung.transform, new Vector3(-0.8f, 0.75f, -0.4f), 0.07f, 1.5f, "aspal");
            Cyl("termos", warung.transform, new Vector3(0.4f, 0.78f, 0f), 0.24f, 0.36f, "beton");
            Shadow(warung.transform, Vector3.zero, 2.0f, "tinta");
            OrangSederhana(d.t, new Vector3(pWarung.x - 0.6f, 0f, pWarung.z + 0.9f), FaceYaw, "krem", false);

            Awan(d.t, new Vector3(pAwan.x, pAwan.y, pAwan.z) + ViewFwd * 0.5f, 1.5f);
            Awan(d.t, new Vector3(2.6f, 4.6f, 2.2f), 1.1f);

            Kerucut(d.t, new Vector3(-2.6f, 0f, -1.2f));
            Kerucut(d.t, new Vector3(-1.4f, 0f, -1.9f));
            Kerucut(d.t, new Vector3(0.4f, 0f, -2.2f));
            Pagar(d.t, new Vector3(-3.4f, 0f, -2.6f), new Vector3(1.4f, 0f, -3.0f), 5);
            Spawn("pohon", d.t, new Vector3(-2.5f, 0f, 3.2f), 0f, 0.8f);

            List<Tappable> grup = new List<Tappable>(7);
            AddTap(grup, Tap(d, "m04-excavator", "temuan:seri", pSeri, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:posisi", pPosisi, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:rusak", pRusak, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:operator", pOperator, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:spanduk", pSpanduk, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:warung", pWarung, "pin", false));
            AddTap(grup, Tap(d, "m04-excavator", "temuan:awan", pAwan, "pin", false));
            Spread(d, grup, MinGap);
        }

        /// <summary>Kantor Raksa - dipakai misi 5, tutorial, dan ronde penentuan.</summary>
        private static void DioKantor(Dio d)
        {
            Ground(d, "krem");
            Box("lantai", d.t, new Vector3(0f, 0.02f, 0.4f), new Vector3(7.4f, 0.04f, 7.0f), "beton", 0f);
            Box("dinding-belakang", d.t, new Vector3(0f, 1.8f, 3.7f), new Vector3(8.0f, 3.6f, 0.24f), "krem", 0f);
            Box("dinding-kanan", d.t, new Vector3(3.8f, 1.8f, 1.0f), new Vector3(0.24f, 3.6f, 5.6f), "krem", 0f);
            Box("jendela", d.t, new Vector3(-1.8f, 2.1f, 3.55f), new Vector3(2.6f, 1.3f, 0.08f), "kaca", 0f);
            Box("bingkai-jendela", d.t, new Vector3(-1.8f, 2.1f, 3.6f), new Vector3(2.8f, 1.5f, 0.06f), "hijau", 0f);
            Box("papan-tulis", d.t, new Vector3(1.4f, 2.2f, 3.5f), new Vector3(2.8f, 1.5f, 0.1f), "putih", 0f);
            Box("rangka-papan", d.t, new Vector3(1.4f, 2.2f, 3.58f), new Vector3(3.0f, 1.7f, 0.08f), "hijau", 0f);

            Spawn("meja-kerja", d.t, new Vector3(-2.7f, 0f, 1.6f), FaceYaw + 20f, 1f);
            Spawn("meja-kerja", d.t, new Vector3(2.6f, 0f, 1.4f), FaceYaw - 20f, 1f);
            Spawn("pohon", d.t, new Vector3(-2.4f, 0f, 3.2f), 0f, 0.55f);
            OrangSederhana(d.t, new Vector3(-3.0f, 0f, 0.6f), FaceYaw + 30f, "hijau", false);

            // Tutorial: tiga kartu di meja panjang paling depan.
            MejaPanjang(d.t, new Vector3(0f, 0f, -1.7f), 5.6f, FaceYaw);
            string[] latihan = Anchors("tutorial", "latihan");
            string[] bentukLatihan = new string[] { "helm", "kopi", "kucing" };
            List<Tappable> grupTutorial = new List<Tappable>(latihan.Length);
            for (int i = 0; i < latihan.Length; i++)
            {
                Vector3 pos = new Vector3(0f, 1.2f, -1.7f) + ViewRight * ((i - (latihan.Length - 1) * 0.5f) * 1.95f);
                string bentuk = i < bentukLatihan.Length ? bentukLatihan[i] : "papan";
                AddTap(grupTutorial, Tap(d, "tutorial", latihan[i], pos, bentuk, true));
            }
            Spread(d, grupTutorial, MinGap);

            // Misi 5: dua kartu polis di papan tulis (lebih tinggi, tidak menumpuk kartu latihan).
            List<Tappable> grupKasus = TapRow(d, "m05-polis-mana", "cocok", new Vector3(1.4f, 2.6f, 3.0f), Vector3.right, 2.5f, "kartu");
            Spread(d, grupKasus, MinGap);

            // Ronde penentuan: empat papan berdiri di tengah ruang.
            List<Tappable> grupPenentuan = TapRow(d, "m11-penentuan", "penentuan", new Vector3(0f, 1.3f, 0.9f), ViewRight, 1.9f, "papan");
            Spread(d, grupPenentuan, MinGap);
        }

        /// <summary>Misi 6 - selisih jumlah peti di pelabuhan.</summary>
        private static void DioPelabuhan(Dio d)
        {
            Ground(d, "beton");
            Air(d.t, new Vector3(0f, 0f, 3.2f), 9.4f, 0.05f);
            Box("dermaga", d.t, new Vector3(0f, 0.06f, -0.6f), new Vector3(8.2f, 0.16f, 5.6f), "beton", 0f);
            Box("tepi-dermaga", d.t, new Vector3(0f, 0.2f, 2.18f), new Vector3(8.2f, 0.22f, 0.24f), "kuning", 0f);

            Spawn("kapal", d.t, new Vector3(-0.6f, 0.35f, 5.0f), 96f, 1f);
            Spawn("kontainer", d.t, new Vector3(-2.9f, 0f, 0.9f), FaceYaw + 12f, 1f);
            Spawn("kontainer", d.t, new Vector3(3.0f, 0f, 1.2f), FaceYaw - 16f, 0.95f);

            // Delapan peti diterima, dua di antaranya penyok.
            for (int i = 0; i < 8; i++)
            {
                int kolom = i % 4;
                int baris = i / 4;
                GameObject peti = Spawn("peti", d.t, new Vector3(-1.5f + kolom * 0.95f, baris * 0.72f, 0.4f), 8f * i, 1f);
                if (peti != null && i >= 6)
                {
                    Box("penyok", peti.transform, new Vector3(0.2f, 0.42f, -0.34f), new Vector3(0.4f, 0.26f, 0.14f), "karat", 0f);
                }
            }
            Spawn("forklift", d.t, new Vector3(2.4f, 0f, -0.9f), FaceYaw + 40f, 0.9f);
            OrangSederhana(d.t, new Vector3(-2.6f, 0f, -0.6f), FaceYaw - 15f, "kuning", true);
            Cyl("bolar-kiri", d.t, new Vector3(-2.2f, 0.3f, 2.05f), 0.28f, 0.5f, "aspal");
            Cyl("bolar-kanan", d.t, new Vector3(2.2f, 0.3f, 2.05f), 0.28f, 0.5f, "aspal");

            List<Tappable> grup = TapRow(d, "m06-paket-penyok", "tindak", new Vector3(0f, 1.3f, -1.4f), ViewRight, 1.9f, "papan");
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 7 - banjir di gudang; bandingkan dua polis lalu alasannya.</summary>
        private static void DioGudang(Dio d)
        {
            Ground(d, "beton");
            Spawn("gudang", d.t, new Vector3(0.2f, 0f, 3.0f), FaceYaw, 1.1f);
            Air(d.t, new Vector3(0f, 0f, 0.6f), 7.6f, 0.16f);
            Box("garis-air", d.t, new Vector3(0.2f, 0.3f, 1.35f), new Vector3(4.6f, 0.07f, 0.06f), "air", 0f);

            Rak(d.t, new Vector3(-1.9f, 0f, 2.6f), FaceYaw + 10f, "cokelat");
            Rak(d.t, new Vector3(2.9f, 0f, 2.0f), FaceYaw - 12f, "karat");
            Spawn("peti", d.t, new Vector3(-1.4f, 0.1f, 0.9f), 24f, 1f);
            Spawn("peti", d.t, new Vector3(1.5f, 0.1f, 1.1f), -18f, 1f);
            Spawn("peti", d.t, new Vector3(0.2f, 0.1f, 0.2f), 6f, 0.9f);
            OrangSederhana(d.t, new Vector3(-3.2f, 0f, -0.4f), FaceYaw + 18f, "kuning", true);
            Spawn("pohon", d.t, new Vector3(3.5f, 0f, -1.6f), 0f, 0.8f);

            // Dua baris: kartu polis di atas, alasan di bawah (jarak layar 1.9).
            List<Tappable> grup = new List<Tappable>(7);
            grup.AddRange(TapRow(d, "m07-banjir-gudang", "polis", new Vector3(0f, 3.0f, 0.9f), Vector3.right, 2.5f, "kartu"));
            grup.AddRange(TapRow(d, "m07-banjir-gudang", "alasan", new Vector3(0f, 0.85f, -1.6f), Vector3.right, 2.3f, "papan"));
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 8 - benturan atau keausan di gudang alat berat.</summary>
        private static void DioGudangForklift(Dio d)
        {
            Ground(d, "beton");
            Box("dinding-belakang", d.t, new Vector3(0f, 1.9f, 3.7f), new Vector3(8.2f, 3.8f, 0.24f), "beton", 0f);
            Box("garis-dinding", d.t, new Vector3(0f, 1.0f, 3.55f), new Vector3(8.0f, 0.12f, 0.06f), "kuning", 0f);
            Box("atap", d.t, new Vector3(0f, 3.8f, 1.4f), new Vector3(8.4f, 0.22f, 5.0f), "kuning-tua", 0f);
            Cyl("tiang-kiri", d.t, new Vector3(-3.6f, 1.9f, -0.8f), 0.2f, 3.8f, "karat");
            Cyl("tiang-kanan", d.t, new Vector3(3.6f, 1.9f, -0.8f), 0.2f, 3.8f, "karat");

            GameObject fl = Spawn("forklift", d.t, new Vector3(-0.4f, 0f, 1.9f), FaceYaw + 16f, 1.1f);
            if (fl != null) Box("penyok", fl.transform, new Vector3(-0.56f, 0.6f, 0.2f), new Vector3(0.12f, 0.36f, 0.6f), "karat", 0f);
            Spawn("kontainer", d.t, new Vector3(3.0f, 0f, 2.6f), FaceYaw - 20f, 0.9f);
            Rak(d.t, new Vector3(-2.2f, 0f, 2.9f), FaceYaw + 14f, "hijau");
            Spawn("peti", d.t, new Vector3(2.2f, 0f, 0.4f), 12f, 1f);
            OrangSederhana(d.t, new Vector3(1.4f, 0f, 1.4f), FaceYaw - 24f, "kuning", true);

            string[] anchors = Anchors("m08-benturan-keausan", "klasifikasi");
            string[] bentuk = new string[] { "panel", "catatan", "mesin" };
            List<Tappable> grup = new List<Tappable>(anchors.Length);
            for (int i = 0; i < anchors.Length; i++)
            {
                Vector3 pos = new Vector3(0f, 1.35f, -1.4f) + ViewRight * ((i - (anchors.Length - 1) * 0.5f) * 2.0f);
                AddTap(grup, Tap(d, "m08-benturan-keausan", anchors[i], pos, i < bentuk.Length ? bentuk[i] : "papan", true));
            }
            Spread(d, grup, MinGap);
        }

        /// <summary>Misi 9 - meja hitung; seluruh langkah berupa angka, tanpa objek tap.</summary>
        private static void DioKantorHitung(Dio d)
        {
            Ground(d, "krem");
            Box("lantai", d.t, new Vector3(0f, 0.02f, 0.4f), new Vector3(7.4f, 0.04f, 7.0f), "beton", 0f);
            Box("dinding-belakang", d.t, new Vector3(0f, 1.8f, 3.7f), new Vector3(8.0f, 3.6f, 0.24f), "krem", 0f);
            Box("papan-hitung", d.t, new Vector3(0.6f, 2.3f, 3.5f), new Vector3(3.4f, 1.7f, 0.1f), "putih", 0f);
            Box("rangka-papan", d.t, new Vector3(0.6f, 2.3f, 3.58f), new Vector3(3.6f, 1.9f, 0.08f), "hijau", 0f);
            Box("baris-papan-1", d.t, new Vector3(0.2f, 2.7f, 3.43f), new Vector3(2.2f, 0.12f, 0.04f), "hijau-tua", 0f);
            Box("baris-papan-2", d.t, new Vector3(-0.1f, 2.4f, 3.43f), new Vector3(1.6f, 0.12f, 0.04f), "kuning-tua", 0f);
            Box("baris-papan-3", d.t, new Vector3(0.4f, 2.1f, 3.43f), new Vector3(2.6f, 0.12f, 0.04f), "beton", 0f);

            MejaPanjang(d.t, new Vector3(0f, 0f, -0.6f), 5.6f, FaceYaw);
            Spawn("meja-kerja", d.t, new Vector3(2.7f, 0f, 1.8f), FaceYaw - 24f, 1f);
            Rak(d.t, new Vector3(-2.2f, 0f, 3.0f), FaceYaw + 16f, "cokelat");

            // Alat hitung di meja depan.
            GameObject kalkulator = Node("kalkulator", d.t, new Vector3(-0.9f, 0.79f, -1.0f));
            kalkulator.transform.localEulerAngles = new Vector3(0f, FaceYaw, 0f);
            Box("badan", kalkulator.transform, Vector3.zero, new Vector3(0.5f, 0.07f, 0.72f), "tinta", 0f);
            Box("layar", kalkulator.transform, new Vector3(0f, 0.05f, -0.22f), new Vector3(0.38f, 0.02f, 0.18f), "kaca", 0f);
            for (int i = 0; i < 6; i++)
            {
                Box("tombol-" + i, kalkulator.transform, new Vector3(-0.14f + (i % 3) * 0.14f, 0.05f, 0.04f + (i / 3) * 0.16f), new Vector3(0.1f, 0.02f, 0.1f), "krem", 0f);
            }
            Box("kertas-hitung", d.t, new Vector3(0.4f, 0.79f, -1.1f), new Vector3(0.7f, 0.03f, 0.5f), "putih", FaceYaw);
            Box("kertas-hitung-2", d.t, new Vector3(1.3f, 0.79f, -0.8f), new Vector3(0.62f, 0.03f, 0.46f), "krem", FaceYaw + 12f);
            Cyl("lampu-meja", d.t, new Vector3(2.0f, 0.95f, -0.4f), 0.12f, 0.5f, "hijau");
            Plate("kap-lampu", d.t, new Vector3(2.0f, 1.24f, -0.4f), 0.44f, 0.12f, "kuning");
            OrangSederhana(d.t, new Vector3(-2.4f, 0f, 0.8f), FaceYaw + 26f, "hijau", false);
        }

        /// <summary>Misi 10 - tiga aset di kompleks usaha kota yang terdampak banjir.</summary>
        private static void DioKotaBanjir(Dio d)
        {
            Ground(d, "aspal");
            Air(d.t, new Vector3(0f, 0f, 0.2f), 8.0f, 0.12f);
            Box("jalan", d.t, new Vector3(0f, 0.03f, -1.6f), new Vector3(8.2f, 0.06f, 1.8f), "aspal", 0f);
            Box("garis-jalan", d.t, new Vector3(0f, 0.07f, -1.6f), new Vector3(6.4f, 0.03f, 0.1f), "kuning", 0f);

            // Kasus A: mobil operasional. Kasus B: alat berat. Kasus C: gudang.
            Spawn("mobil", d.t, new Vector3(-2.6f, 0.18f, 0.4f), FaceYaw + 8f, 1f);
            Spawn("excavator", d.t, new Vector3(0f, 0.18f, 0.9f), FaceYaw + 18f, 0.9f);
            Spawn("gudang", d.t, new Vector3(2.9f, 0.18f, 1.6f), FaceYaw - 12f, 0.85f);
            Spawn("gedung-kantor", d.t, new Vector3(-3.0f, 0f, 3.4f), FaceYaw + 16f, 0.9f);
            Spawn("ruko", d.t, new Vector3(0.6f, 0f, 3.6f), FaceYaw, 0.8f);
            Spawn("lampu-jalan", d.t, new Vector3(3.6f, 0f, -1.2f), FaceYaw, 1f);
            Spawn("pohon", d.t, new Vector3(-3.7f, 0f, -0.6f), 0f, 0.8f);
            Awan(d.t, new Vector3(-2.2f, 4.9f, 1.6f), 1.3f);
            Awan(d.t, new Vector3(2.4f, 5.2f, 2.4f), 1.0f);
            OrangSederhana(d.t, new Vector3(1.6f, 0.15f, -0.6f), FaceYaw - 18f, "kuning", true);

            // Tiga tahap = tiga tinggi penanda; tiga kasus = tiga kolom.
            // Tiap tahap juga digeser ke belakang supaya tetap terpisah pada sudut "atas".
            List<Tappable> grup = new List<Tappable>(9);
            grup.AddRange(TapRow(d, "m10-grand-mission", "produk", new Vector3(0f, 1.0f, -1.4f), Vector3.right, 2.6f, "pin"));
            grup.AddRange(TapRow(d, "m10-grand-mission", "periksa", new Vector3(0f, 3.2f, 0.4f), Vector3.right, 2.6f, "pin"));
            grup.AddRange(TapRow(d, "m10-grand-mission", "tindak", new Vector3(0f, 5.4f, 2.2f), Vector3.right, 2.6f, "pin"));
            Spread(d, grup, MinGap);
        }

        private static void AddTap(List<Tappable> list, Tappable tap)
        {
            if (tap != null) list.Add(tap);
        }

        // ---------------------------------------------------------- validasi

        /// <summary>Setiap anchor di data misi WAJIB ada di diorama scene-nya.</summary>
        private static bool Validate(List<DioramaRoot> dioramas)
        {
            Dictionary<string, DioramaRoot> bySceneKey = new Dictionary<string, DioramaRoot>(dioramas.Count);
            for (int i = 0; i < dioramas.Count; i++)
            {
                if (dioramas[i] != null) bySceneKey[dioramas[i].sceneKey] = dioramas[i];
            }

            List<string> hilang = new List<string>();
            foreach (KeyValuePair<string, List<string>> kv in _anchors)
            {
                string mission = kv.Key;
                string scene;
                if (!_sceneOf.TryGetValue(mission, out scene))
                {
                    hilang.Add(mission + " : scene tidak diketahui");
                    continue;
                }
                DioramaRoot d;
                if (!bySceneKey.TryGetValue(scene, out d))
                {
                    hilang.Add(mission + " : diorama \"" + scene + "\" tidak ada di scene");
                    continue;
                }

                HashSet<string> ada = new HashSet<string>();
                Tappable[] taps = d.GetComponentsInChildren<Tappable>(true);
                for (int i = 0; i < taps.Length; i++)
                {
                    if (taps[i] != null) ada.Add(taps[i].Anchor);
                }
                for (int i = 0; i < kv.Value.Count; i++)
                {
                    if (!ada.Contains(kv.Value[i])) hilang.Add(mission + " / " + scene + " : " + kv.Value[i]);
                }
            }

            if (hilang.Count > 0)
            {
                Debug.LogError("[Raksa] " + hilang.Count + " anchor belum ada di diorama:\n - " +
                               string.Join("\n - ", hilang.ToArray()) +
                               "\n[Raksa] Tambahkan objek tersebut di RaksaSceneGenerator.cs lalu generate ulang.");
                return false;
            }

            int total = 0;
            foreach (KeyValuePair<string, List<string>> kv in _anchors) total += kv.Value.Count;
            Debug.Log("[Raksa] validasi lolos: " + total + " anchor misi ada di diorama-nya.");
            return true;
        }
    }
}
