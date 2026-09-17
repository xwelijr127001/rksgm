using System.Collections.Generic;
using Raksa.Game;
using UnityEditor;
using UnityEngine;

namespace Raksa.EditorTools
{
    /// <summary>
    /// Bagian pembentuk bentuk, material, dan prefab dari generator diorama.
    /// Dipisah dari RaksaSceneGenerator.cs supaya alur generate tetap terbaca.
    ///
    /// Gaya: "miniature city diorama" kartun ramah. Semua bentuk disusun dari
    /// primitive Unity (Cube/Cylinder/Sphere) yang dirapikan skalanya. Bagian
    /// DEPAN setiap prefab selalu menghadap -Z, jadi rotY = FaceYaw membuatnya
    /// menghadap kamera isometrik.
    ///
    /// Poligon: Cube 12 tris, Cylinder ~80-96 tris, Sphere ~768 tris. Sphere hanya
    /// dipakai untuk kepala petugas & maskot; sisanya box/cylinder.
    ///
    /// ponytail: perkiraan 5rb-10rb tris per diorama (target awal 6rb). Penyumbang
    /// terbesar: Sphere kepala (768 tris x2) dan penanda (4 piringan, ~384 tris per
    /// objek tap). Bila perlu lebih ringan: ganti Ball -> Cyl untuk kepala dan buang
    /// piringan "cincin-dalam" di MakeMarker (hemat ~1,8rb tris pada diorama dengan
    /// 9 penanda). Batas nyata di HP adalah draw call, dan itu sudah ditekan dengan
    /// 13 material bersama + GPU instancing.
    /// </summary>
    public static partial class RaksaSceneGenerator
    {
        // ------------------------------------------------------------ material

        /// <summary>Palet matte; 13 material dipakai bersama seluruh scene.</summary>
        private static readonly string[][] Palette = new string[][]
        {
            new string[] { "hijau", "#176B45" },
            new string[] { "hijau-tua", "#0E4B2F" },
            new string[] { "kuning", "#F6C445" },
            new string[] { "kuning-tua", "#D8A41F" },
            new string[] { "krem", "#FFF9E9" },
            new string[] { "tinta", "#17362A" },
            new string[] { "cokelat", "#5B4636" },
            new string[] { "aspal", "#4A5250" },
            new string[] { "kaca", "#BFD9E8" },
            new string[] { "air", "#2F6FB0" },
            new string[] { "putih", "#FFFFFF" },
            new string[] { "karat", "#C4452F" },
            new string[] { "beton", "#9AA3A0" },
        };

        private static Dictionary<string, Material> _mats;
        private static Dictionary<string, GameObject> _prefabs;

        private static bool BuildMaterials()
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null)
            {
                Debug.LogError("[Raksa] Shader \"Standard\" tidak ditemukan. Proyek ini memakai built-in render pipeline.");
                return false;
            }

            _mats = new Dictionary<string, Material>(Palette.Length);
            for (int i = 0; i < Palette.Length; i++)
            {
                string key = Palette[i][0];
                Material m = new Material(shader);
                m.name = "raksa-" + key;
                m.color = Hex(Palette[i][1]);
                // Matte: metallic 0, smoothness rendah. Kaca sedikit lebih halus.
                m.SetFloat("_Metallic", 0f);
                m.SetFloat("_Glossiness", key == "kaca" ? 0.3f : 0.07f);
                // Properti tambahan supaya Tappable.SetFloat("_RaksaSelected") aman.
                m.SetFloat("_RaksaSelected", 0f);
                m.enableInstancing = true;
                AssetDatabase.CreateAsset(m, MaterialDir + "/raksa-" + key + ".mat");
                _mats[key] = m;
            }
            Debug.Log("[Raksa] " + _mats.Count + " material dibuat di " + MaterialDir);
            return true;
        }

        private static Material M(string key)
        {
            Material m;
            if (_mats != null && _mats.TryGetValue(key, out m) && m != null) return m;
            Debug.LogError("[Raksa] material tidak dikenal: " + key);
            if (_mats != null && _mats.TryGetValue("krem", out m)) return m;
            return null;
        }

        private static Color Hex(string hex)
        {
            Color c;
            if (ColorUtility.TryParseHtmlString(hex, out c)) return c;
            return Color.white;
        }

        // ------------------------------------------------------------ primitif

        private static GameObject Node(string name, Transform parent, Vector3 pos)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = pos;
            return go;
        }

        /// <summary>Primitive tanpa collider (collider hanya dipasang pada Tappable).</summary>
        private static GameObject Prim(PrimitiveType type, string name, Transform parent, Vector3 pos, Vector3 scale, string mat, Vector3 euler)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            Collider col = go.GetComponent<Collider>();
            if (col != null) UnityEngine.Object.DestroyImmediate(col);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = pos;
            go.transform.localEulerAngles = euler;
            go.transform.localScale = scale;
            MeshRenderer r = go.GetComponent<MeshRenderer>();
            if (r != null) r.sharedMaterial = M(mat);
            return go;
        }

        private static GameObject Box(string name, Transform p, Vector3 pos, Vector3 size, string mat, float rotY)
        {
            return Prim(PrimitiveType.Cube, name, p, pos, size, mat, new Vector3(0f, rotY, 0f));
        }

        private static GameObject BoxE(string name, Transform p, Vector3 pos, Vector3 size, string mat, Vector3 euler)
        {
            return Prim(PrimitiveType.Cube, name, p, pos, size, mat, euler);
        }

        /// <summary>Silinder tegak; tinggi &amp; diameter dalam satuan dunia (1 = 1 meter).</summary>
        private static GameObject Cyl(string name, Transform p, Vector3 pos, float diameter, float height, string mat)
        {
            return Prim(PrimitiveType.Cylinder, name, p, pos, new Vector3(diameter, height * 0.5f, diameter), mat, Vector3.zero);
        }

        private static GameObject CylE(string name, Transform p, Vector3 pos, float diameter, float height, string mat, Vector3 euler)
        {
            return Prim(PrimitiveType.Cylinder, name, p, pos, new Vector3(diameter, height * 0.5f, diameter), mat, euler);
        }

        /// <summary>Piringan datar menghadap atas (alas tanah, bayangan, tatakan).</summary>
        private static GameObject Plate(string name, Transform p, Vector3 pos, float diameter, float thickness, string mat)
        {
            return Prim(PrimitiveType.Cylinder, name, p, pos, new Vector3(diameter, thickness * 0.5f, diameter), mat, Vector3.zero);
        }

        /// <summary>Piringan menghadap -Z/+Z (dipakai penanda &amp; mata maskot).</summary>
        private static GameObject Badge(string name, Transform p, Vector3 pos, float diameter, float thickness, string mat)
        {
            return Prim(PrimitiveType.Cylinder, name, p, pos, new Vector3(diameter, thickness * 0.5f, diameter), mat, new Vector3(90f, 0f, 0f));
        }

        private static GameObject Ball(string name, Transform p, Vector3 pos, float diameter, string mat)
        {
            return Prim(PrimitiveType.Sphere, name, p, pos, new Vector3(diameter, diameter, diameter), mat, Vector3.zero);
        }

        /// <summary>Bayangan lembut: piringan tipis gelap menempel di tanah.</summary>
        private static void Shadow(Transform p, Vector3 pos, float diameter, string mat)
        {
            GameObject go = Plate("bayangan", p, new Vector3(pos.x, 0.015f, pos.z), diameter, 0.02f, mat);
            MeshRenderer r = go.GetComponent<MeshRenderer>();
            if (r != null)
            {
                r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                r.receiveShadows = false;
            }
        }

        // ------------------------------------------------------ elemen bersama

        /// <summary>Alas tanah membulat: tepi rumput + permukaan sesuai lokasi.</summary>
        private static void Ground(Dio d, string surface)
        {
            Plate("alas-tepi", d.t, new Vector3(0f, -0.24f, 0f), (PlateRadius + 0.55f) * 2f, 0.36f, "hijau");
            Plate("alas", d.t, new Vector3(0f, -0.11f, 0f), PlateRadius * 2f, 0.22f, surface);
        }

        private static void MejaPanjang(Transform p, Vector3 pos, float length, float rotY)
        {
            GameObject meja = Node("meja-panjang", p, pos);
            meja.transform.localEulerAngles = new Vector3(0f, rotY, 0f);
            Box("papan", meja.transform, new Vector3(0f, 0.72f, 0f), new Vector3(length, 0.1f, 1.0f), "cokelat", 0f);
            Box("bibir", meja.transform, new Vector3(0f, 0.64f, -0.48f), new Vector3(length, 0.1f, 0.08f), "kuning-tua", 0f);
            float lx = length * 0.5f - 0.18f;
            for (int i = 0; i < 4; i++)
            {
                float x = (i < 2) ? -lx : lx;
                float z = (i % 2 == 0) ? -0.38f : 0.38f;
                Box("kaki-" + i, meja.transform, new Vector3(x, 0.34f, z), new Vector3(0.1f, 0.68f, 0.1f), "aspal", 0f);
            }
            Shadow(meja.transform, Vector3.zero, length * 0.8f, "tinta");
        }

        private static void Rak(Transform p, Vector3 pos, float rotY, string isi)
        {
            GameObject rak = Node("rak", p, pos);
            rak.transform.localEulerAngles = new Vector3(0f, rotY, 0f);
            Box("tiang-kiri", rak.transform, new Vector3(-0.9f, 1.1f, 0f), new Vector3(0.1f, 2.2f, 0.7f), "karat", 0f);
            Box("tiang-kanan", rak.transform, new Vector3(0.9f, 1.1f, 0f), new Vector3(0.1f, 2.2f, 0.7f), "karat", 0f);
            for (int i = 0; i < 3; i++)
            {
                float y = 0.5f + i * 0.72f;
                Box("papan-" + i, rak.transform, new Vector3(0f, y, 0f), new Vector3(1.9f, 0.08f, 0.72f), "beton", 0f);
                Box("kardus-a-" + i, rak.transform, new Vector3(-0.45f, y + 0.26f, 0f), new Vector3(0.5f, 0.44f, 0.5f), isi, 0f);
                Box("kardus-b-" + i, rak.transform, new Vector3(0.42f, y + 0.22f, 0.02f), new Vector3(0.44f, 0.36f, 0.44f), "cokelat", 0f);
            }
            Shadow(rak.transform, Vector3.zero, 2.1f, "tinta");
        }

        private static void Pagar(Transform p, Vector3 from, Vector3 to, int tiang)
        {
            Vector3 delta = to - from;
            float len = delta.magnitude;
            if (len < 0.1f || tiang < 2) return;
            GameObject g = Node("pagar", p, Vector3.zero);
            float yaw = Mathf.Atan2(delta.x, delta.z) * Mathf.Rad2Deg;
            Vector3 mid = from + delta * 0.5f;
            BoxE("palang-atas", g.transform, mid + new Vector3(0f, 0.82f, 0f), new Vector3(0.07f, 0.07f, len), "kuning", new Vector3(0f, yaw, 0f));
            BoxE("palang-bawah", g.transform, mid + new Vector3(0f, 0.44f, 0f), new Vector3(0.06f, 0.06f, len), "kuning-tua", new Vector3(0f, yaw, 0f));
            for (int i = 0; i < tiang; i++)
            {
                Vector3 pos = from + delta * (i / (float)(tiang - 1));
                Box("tiang-" + i, g.transform, pos + new Vector3(0f, 0.45f, 0f), new Vector3(0.09f, 0.9f, 0.09f), "aspal", yaw);
            }
        }

        private static void Kerucut(Transform p, Vector3 pos)
        {
            GameObject k = Node("kerucut", p, pos);
            Plate("dasar", k.transform, new Vector3(0f, 0.04f, 0f), 0.44f, 0.08f, "tinta");
            Cyl("badan", k.transform, new Vector3(0f, 0.24f, 0f), 0.28f, 0.4f, "karat");
            Cyl("pita", k.transform, new Vector3(0f, 0.3f, 0f), 0.31f, 0.09f, "krem");
            Cyl("ujung", k.transform, new Vector3(0f, 0.46f, 0f), 0.14f, 0.16f, "karat");
        }

        private static void Awan(Transform p, Vector3 pos, float size)
        {
            GameObject a = Node("awan", p, pos);
            Cyl("gumpal-1", a.transform, Vector3.zero, size, size * 0.5f, "putih");
            Cyl("gumpal-2", a.transform, new Vector3(-size * 0.45f, -0.06f, 0f), size * 0.7f, size * 0.42f, "putih");
            Cyl("gumpal-3", a.transform, new Vector3(size * 0.48f, -0.04f, 0.05f), size * 0.62f, size * 0.38f, "krem");
        }

        /// <summary>Orang pelengkap (bukan pemain): tanpa CharacterMover, kepala silinder.</summary>
        private static void OrangSederhana(Transform p, Vector3 pos, float rotY, string seragam, bool helm)
        {
            GameObject o = Node("orang", p, pos);
            o.transform.localEulerAngles = new Vector3(0f, rotY, 0f);
            Shadow(o.transform, Vector3.zero, 0.9f, "tinta");
            Box("kaki-kiri", o.transform, new Vector3(-0.11f, 0.38f, 0f), new Vector3(0.15f, 0.76f, 0.2f), "tinta", 0f);
            Box("kaki-kanan", o.transform, new Vector3(0.11f, 0.38f, 0f), new Vector3(0.15f, 0.76f, 0.2f), "tinta", 0f);
            Box("badan", o.transform, new Vector3(0f, 1.05f, 0f), new Vector3(0.46f, 0.62f, 0.28f), seragam, 0f);
            Box("lengan-kiri", o.transform, new Vector3(-0.3f, 1.0f, -0.02f), new Vector3(0.13f, 0.52f, 0.18f), seragam, 0f);
            Box("lengan-kanan", o.transform, new Vector3(0.3f, 1.0f, -0.02f), new Vector3(0.13f, 0.52f, 0.18f), seragam, 0f);
            Cyl("kepala", o.transform, new Vector3(0f, 1.52f, 0f), 0.3f, 0.32f, "krem");
            Cyl("rambut", o.transform, new Vector3(0f, 1.66f, 0f), 0.32f, 0.1f, "tinta");
            Badge("mata-kiri", o.transform, new Vector3(-0.07f, 1.54f, -0.15f), 0.06f, 0.03f, "tinta");
            Badge("mata-kanan", o.transform, new Vector3(0.07f, 1.54f, -0.15f), 0.06f, 0.03f, "tinta");
            if (helm)
            {
                Cyl("helm", o.transform, new Vector3(0f, 1.73f, 0f), 0.36f, 0.18f, "kuning");
                Plate("helm-tepi", o.transform, new Vector3(0f, 1.66f, 0f), 0.48f, 0.06f, "kuning");
            }
        }

        /// <summary>Genangan air / permukaan laut.</summary>
        private static void Air(Transform p, Vector3 pos, float diameter, float y)
        {
            GameObject go = Plate("air", p, new Vector3(pos.x, y, pos.z), diameter, 0.06f, "air");
            MeshRenderer r = go.GetComponent<MeshRenderer>();
            if (r != null) r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        }

        // -------------------------------------------------------------- prefab

        private static bool BuildPrefabs()
        {
            _prefabs = new Dictionary<string, GameObject>(20);
            SavePrefab(MakeGedungKantor(), "gedung-kantor");
            SavePrefab(MakeRuko(), "ruko");
            SavePrefab(MakeGudang(), "gudang");
            SavePrefab(MakePohon(), "pohon");
            SavePrefab(MakeLampuJalan(), "lampu-jalan");
            SavePrefab(MakeMobil(), "mobil");
            SavePrefab(MakeExcavator(), "excavator");
            SavePrefab(MakeForklift(), "forklift");
            SavePrefab(MakePeti(), "peti");
            SavePrefab(MakeKontainer(), "kontainer");
            SavePrefab(MakeKapal(), "kapal");
            SavePrefab(MakeMejaKerja(), "meja-kerja");
            SavePrefab(MakePetugas(), "petugas");
            SavePrefab(MakeRaki(), "raki");
            SavePrefab(MakeMarker(), "marker");
            SavePrefab(MakePapanNama(), "papan-nama");
            Debug.Log("[Raksa] " + _prefabs.Count + " prefab dibuat di " + PrefabDir);
            return _prefabs.Count == 16;
        }

        private static void SavePrefab(GameObject go, string key)
        {
            if (go == null)
            {
                Debug.LogError("[Raksa] gagal membangun prefab: " + key);
                return;
            }
            string path = PrefabDir + "/raksa-" + key + ".prefab";
            GameObject asset = PrefabUtility.SaveAsPrefabAsset(go, path);
            if (asset == null) Debug.LogError("[Raksa] gagal menyimpan prefab: " + path);
            else _prefabs[key] = asset;
            UnityEngine.Object.DestroyImmediate(go);
        }

        private static GameObject Spawn(string key, Transform parent, Vector3 pos, float rotY, float scale)
        {
            GameObject pf;
            if (_prefabs == null || !_prefabs.TryGetValue(key, out pf) || pf == null)
            {
                Debug.LogError("[Raksa] prefab tidak ada: " + key);
                return null;
            }
            GameObject go = PrefabUtility.InstantiatePrefab(pf) as GameObject;
            if (go == null) return null;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = pos;
            go.transform.localEulerAngles = new Vector3(0f, rotY, 0f);
            go.transform.localScale = new Vector3(scale, scale, scale);
            return go;
        }

        private static GameObject MakeGedungKantor()
        {
            GameObject g = new GameObject("gedung-kantor");
            Shadow(g.transform, Vector3.zero, 3.6f, "tinta");
            Box("dasar", g.transform, new Vector3(0f, 0.2f, 0f), new Vector3(3.4f, 0.4f, 2.8f), "beton", 0f);
            Box("badan", g.transform, new Vector3(0f, 2.3f, 0f), new Vector3(3.1f, 4.2f, 2.5f), "krem", 0f);
            Box("atap", g.transform, new Vector3(0f, 4.5f, 0f), new Vector3(3.4f, 0.26f, 2.8f), "hijau", 0f);
            Box("atap-kotak", g.transform, new Vector3(0f, 4.74f, 0f), new Vector3(1.4f, 0.24f, 1.2f), "hijau-tua", 0f);
            for (int i = 0; i < 3; i++)
            {
                Box("bingkai-" + i, g.transform, new Vector3(0f, 1.5f + i * 1.1f, -1.24f), new Vector3(2.6f, 0.72f, 0.06f), "hijau", 0f);
                Box("jendela-" + i, g.transform, new Vector3(0f, 1.5f + i * 1.1f, -1.29f), new Vector3(2.44f, 0.58f, 0.05f), "kaca", 0f);
            }
            Box("pintu", g.transform, new Vector3(0f, 0.85f, -1.3f), new Vector3(0.9f, 1.3f, 0.1f), "hijau-tua", 0f);
            Box("kanopi", g.transform, new Vector3(0f, 1.62f, -1.6f), new Vector3(1.7f, 0.14f, 0.8f), "kuning", 0f);
            Box("papan-logo", g.transform, new Vector3(0f, 4.0f, -1.32f), new Vector3(1.5f, 0.42f, 0.1f), "kuning", 0f);
            return g;
        }

        private static GameObject MakeRuko()
        {
            GameObject g = new GameObject("ruko");
            Shadow(g.transform, Vector3.zero, 3.0f, "tinta");
            Box("badan", g.transform, new Vector3(0f, 1.6f, 0f), new Vector3(2.6f, 3.2f, 2.2f), "kuning", 0f);
            Box("atap", g.transform, new Vector3(0f, 3.28f, 0f), new Vector3(2.8f, 0.22f, 2.4f), "karat", 0f);
            Box("kaca-atas", g.transform, new Vector3(0f, 2.35f, -1.13f), new Vector3(2.0f, 0.8f, 0.08f), "kaca", 0f);
            Box("kaca-bawah", g.transform, new Vector3(0.55f, 0.85f, -1.13f), new Vector3(1.3f, 1.3f, 0.08f), "kaca", 0f);
            Box("pintu", g.transform, new Vector3(-0.72f, 0.8f, -1.13f), new Vector3(0.8f, 1.6f, 0.1f), "cokelat", 0f);
            Box("kanopi", g.transform, new Vector3(0f, 1.72f, -1.48f), new Vector3(2.7f, 0.12f, 0.9f), "hijau", 0f);
            Box("papan-toko", g.transform, new Vector3(0f, 2.9f, -1.2f), new Vector3(2.2f, 0.42f, 0.12f), "krem", 0f);
            Box("garis-papan", g.transform, new Vector3(0f, 2.9f, -1.27f), new Vector3(1.6f, 0.12f, 0.04f), "hijau", 0f);
            return g;
        }

        private static GameObject MakeGudang()
        {
            GameObject g = new GameObject("gudang");
            Shadow(g.transform, Vector3.zero, 4.6f, "tinta");
            Box("badan", g.transform, new Vector3(0f, 1.45f, 0f), new Vector3(4.4f, 2.9f, 3.2f), "beton", 0f);
            BoxE("atap-kiri", g.transform, new Vector3(-1.1f, 3.22f, 0f), new Vector3(2.5f, 0.16f, 3.3f), "kuning-tua", new Vector3(0f, 0f, 16f));
            BoxE("atap-kanan", g.transform, new Vector3(1.1f, 3.22f, 0f), new Vector3(2.5f, 0.16f, 3.3f), "kuning-tua", new Vector3(0f, 0f, -16f));
            Box("puncak", g.transform, new Vector3(0f, 3.52f, 0f), new Vector3(0.5f, 0.14f, 3.3f), "karat", 0f);
            Box("pintu", g.transform, new Vector3(0f, 1.05f, -1.63f), new Vector3(2.2f, 2.1f, 0.1f), "aspal", 0f);
            for (int i = 0; i < 4; i++)
            {
                Box("pintu-garis-" + i, g.transform, new Vector3(0f, 0.35f + i * 0.5f, -1.69f), new Vector3(2.2f, 0.07f, 0.04f), "beton", 0f);
            }
            Box("papan-gudang", g.transform, new Vector3(0f, 2.55f, -1.66f), new Vector3(1.7f, 0.38f, 0.08f), "kuning", 0f);
            Box("ventilasi", g.transform, new Vector3(1.6f, 2.5f, -1.66f), new Vector3(0.6f, 0.4f, 0.06f), "kaca", 0f);
            return g;
        }

        private static GameObject MakePohon()
        {
            GameObject g = new GameObject("pohon");
            Shadow(g.transform, Vector3.zero, 1.5f, "hijau-tua");
            Cyl("batang", g.transform, new Vector3(0f, 0.45f, 0f), 0.2f, 0.9f, "cokelat");
            Cyl("daun-bawah", g.transform, new Vector3(0f, 1.1f, 0f), 1.5f, 0.55f, "hijau");
            Cyl("daun-atas", g.transform, new Vector3(0f, 1.52f, 0f), 1.0f, 0.42f, "hijau-tua");
            return g;
        }

        private static GameObject MakeLampuJalan()
        {
            GameObject g = new GameObject("lampu-jalan");
            Plate("dasar", g.transform, new Vector3(0f, 0.06f, 0f), 0.44f, 0.12f, "beton");
            Cyl("tiang", g.transform, new Vector3(0f, 1.55f, 0f), 0.11f, 3.1f, "aspal");
            Box("lengan", g.transform, new Vector3(0f, 3.05f, -0.45f), new Vector3(0.08f, 0.08f, 0.9f), "aspal", 0f);
            Box("kepala", g.transform, new Vector3(0f, 2.96f, -0.85f), new Vector3(0.32f, 0.12f, 0.5f), "kuning", 0f);
            return g;
        }

        private static GameObject MakeMobil()
        {
            GameObject g = new GameObject("mobil");
            Shadow(g.transform, Vector3.zero, 2.6f, "tinta");
            Box("sasis", g.transform, new Vector3(0f, 0.36f, 0f), new Vector3(1.6f, 0.3f, 3.2f), "hijau", 0f);
            Box("badan", g.transform, new Vector3(0f, 0.62f, -0.1f), new Vector3(1.52f, 0.36f, 2.9f), "putih", 0f);
            Box("kabin", g.transform, new Vector3(0f, 0.92f, -0.3f), new Vector3(1.3f, 0.34f, 1.4f), "kaca", 0f);
            Box("atap", g.transform, new Vector3(0f, 1.1f, -0.3f), new Vector3(1.24f, 0.08f, 1.34f), "putih", 0f);
            Box("bemper-depan", g.transform, new Vector3(0f, 0.42f, -1.62f), new Vector3(1.48f, 0.24f, 0.12f), "beton", 0f);
            Box("bemper-belakang", g.transform, new Vector3(0f, 0.42f, 1.62f), new Vector3(1.48f, 0.24f, 0.12f), "beton", 0f);
            Box("lampu-kiri", g.transform, new Vector3(-0.5f, 0.64f, -1.58f), new Vector3(0.34f, 0.16f, 0.08f), "kuning", 0f);
            Box("lampu-kanan", g.transform, new Vector3(0.5f, 0.64f, -1.58f), new Vector3(0.34f, 0.16f, 0.08f), "kuning", 0f);
            Box("lampu-belakang", g.transform, new Vector3(0f, 0.64f, 1.58f), new Vector3(1.1f, 0.12f, 0.06f), "karat", 0f);
            Box("plat", g.transform, new Vector3(0f, 0.38f, -1.68f), new Vector3(0.46f, 0.14f, 0.04f), "krem", 0f);
            CylE("roda-depan-kiri", g.transform, new Vector3(-0.78f, 0.32f, -1.0f), 0.62f, 0.24f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-depan-kanan", g.transform, new Vector3(0.78f, 0.32f, -1.0f), 0.62f, 0.24f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-belakang-kiri", g.transform, new Vector3(-0.78f, 0.32f, 1.05f), 0.62f, 0.24f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-belakang-kanan", g.transform, new Vector3(0.78f, 0.32f, 1.05f), 0.62f, 0.24f, "tinta", new Vector3(0f, 0f, 90f));
            return g;
        }

        private static GameObject MakeExcavator()
        {
            GameObject g = new GameObject("excavator");
            Shadow(g.transform, Vector3.zero, 3.0f, "tinta");
            Box("track-kiri", g.transform, new Vector3(-0.62f, 0.32f, 0f), new Vector3(0.44f, 0.52f, 2.5f), "tinta", 0f);
            Box("track-kanan", g.transform, new Vector3(0.62f, 0.32f, 0f), new Vector3(0.44f, 0.52f, 2.5f), "tinta", 0f);
            Box("track-atas-kiri", g.transform, new Vector3(-0.62f, 0.6f, 0f), new Vector3(0.48f, 0.12f, 2.6f), "beton", 0f);
            Box("track-atas-kanan", g.transform, new Vector3(0.62f, 0.6f, 0f), new Vector3(0.48f, 0.12f, 2.6f), "beton", 0f);
            Box("dasar-putar", g.transform, new Vector3(0f, 0.72f, 0f), new Vector3(1.5f, 0.2f, 1.9f), "aspal", 0f);
            Box("badan", g.transform, new Vector3(0f, 1.16f, 0.3f), new Vector3(1.48f, 0.76f, 1.8f), "kuning", 0f);
            Box("pemberat", g.transform, new Vector3(0f, 1.1f, 1.2f), new Vector3(1.4f, 0.66f, 0.5f), "kuning-tua", 0f);
            Box("kabin", g.transform, new Vector3(-0.4f, 1.78f, -0.35f), new Vector3(0.68f, 0.86f, 0.82f), "kaca", 0f);
            Box("kabin-atap", g.transform, new Vector3(-0.4f, 2.22f, -0.35f), new Vector3(0.74f, 0.1f, 0.88f), "kuning", 0f);
            Box("plat-seri", g.transform, new Vector3(0.76f, 1.24f, 0.2f), new Vector3(0.05f, 0.22f, 0.5f), "krem", 0f);
            Cyl("knalpot", g.transform, new Vector3(0.36f, 1.76f, 0.5f), 0.16f, 0.44f, "aspal");
            BoxE("boom", g.transform, new Vector3(0.22f, 1.9f, -1.1f), new Vector3(0.36f, 0.34f, 2.0f), "kuning", new Vector3(-38f, 0f, 0f));
            BoxE("arm", g.transform, new Vector3(0.22f, 2.05f, -2.15f), new Vector3(0.3f, 0.3f, 1.5f), "kuning-tua", new Vector3(52f, 0f, 0f));
            Box("bucket", g.transform, new Vector3(0.22f, 1.28f, -2.6f), new Vector3(0.72f, 0.5f, 0.6f), "kuning-tua", 0f);
            for (int i = 0; i < 3; i++)
            {
                Box("gigi-" + i, g.transform, new Vector3(0.22f + (i - 1) * 0.22f, 1.06f, -2.82f), new Vector3(0.12f, 0.16f, 0.2f), "beton", 0f);
            }
            return g;
        }

        private static GameObject MakeForklift()
        {
            GameObject g = new GameObject("forklift");
            Shadow(g.transform, Vector3.zero, 2.2f, "tinta");
            Box("badan", g.transform, new Vector3(0f, 0.55f, 0.3f), new Vector3(1.05f, 0.7f, 1.5f), "kuning", 0f);
            Box("pemberat", g.transform, new Vector3(0f, 0.4f, 1.05f), new Vector3(1.0f, 0.5f, 0.4f), "kuning-tua", 0f);
            Box("kursi", g.transform, new Vector3(0f, 0.96f, 0.5f), new Vector3(0.5f, 0.12f, 0.5f), "tinta", 0f);
            Box("sandaran", g.transform, new Vector3(0f, 1.2f, 0.75f), new Vector3(0.5f, 0.42f, 0.1f), "tinta", 0f);
            Cyl("tiang-atap-kiri", g.transform, new Vector3(-0.44f, 1.3f, 0.85f), 0.08f, 1.0f, "karat");
            Cyl("tiang-atap-kanan", g.transform, new Vector3(0.44f, 1.3f, 0.85f), 0.08f, 1.0f, "karat");
            Box("atap", g.transform, new Vector3(0f, 1.84f, 0.45f), new Vector3(1.0f, 0.08f, 1.2f), "kuning-tua", 0f);
            Box("mast", g.transform, new Vector3(0f, 1.15f, -0.5f), new Vector3(0.9f, 2.1f, 0.14f), "aspal", 0f);
            Box("carriage", g.transform, new Vector3(0f, 0.5f, -0.58f), new Vector3(0.82f, 0.5f, 0.1f), "beton", 0f);
            Box("fork-kiri", g.transform, new Vector3(-0.28f, 0.12f, -1.05f), new Vector3(0.14f, 0.08f, 1.1f), "beton", 0f);
            Box("fork-kanan", g.transform, new Vector3(0.28f, 0.12f, -1.05f), new Vector3(0.14f, 0.08f, 1.1f), "beton", 0f);
            CylE("roda-depan-kiri", g.transform, new Vector3(-0.5f, 0.26f, -0.2f), 0.5f, 0.2f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-depan-kanan", g.transform, new Vector3(0.5f, 0.26f, -0.2f), 0.5f, 0.2f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-belakang-kiri", g.transform, new Vector3(-0.42f, 0.2f, 0.95f), 0.38f, 0.18f, "tinta", new Vector3(0f, 0f, 90f));
            CylE("roda-belakang-kanan", g.transform, new Vector3(0.42f, 0.2f, 0.95f), 0.38f, 0.18f, "tinta", new Vector3(0f, 0f, 90f));
            return g;
        }

        private static GameObject MakePeti()
        {
            GameObject g = new GameObject("peti");
            Shadow(g.transform, Vector3.zero, 0.95f, "tinta");
            Box("badan", g.transform, new Vector3(0f, 0.36f, 0f), new Vector3(0.78f, 0.7f, 0.78f), "cokelat", 0f);
            Box("pita-x", g.transform, new Vector3(0f, 0.37f, 0f), new Vector3(0.82f, 0.1f, 0.14f), "krem", 0f);
            Box("pita-z", g.transform, new Vector3(0f, 0.37f, 0f), new Vector3(0.14f, 0.1f, 0.82f), "krem", 0f);
            Box("label", g.transform, new Vector3(0f, 0.5f, -0.41f), new Vector3(0.3f, 0.2f, 0.03f), "putih", 0f);
            return g;
        }

        private static GameObject MakeKontainer()
        {
            GameObject g = new GameObject("kontainer");
            Shadow(g.transform, Vector3.zero, 2.8f, "tinta");
            Box("badan", g.transform, new Vector3(0f, 0.68f, 0f), new Vector3(1.28f, 1.3f, 2.6f), "karat", 0f);
            for (int i = 0; i < 5; i++)
            {
                Box("rusuk-" + i, g.transform, new Vector3(0f, 0.68f, -1.0f + i * 0.5f), new Vector3(1.34f, 1.24f, 0.06f), "kuning-tua", 0f);
            }
            Box("pintu", g.transform, new Vector3(0f, 0.68f, -1.32f), new Vector3(1.2f, 1.2f, 0.06f), "beton", 0f);
            Box("palang-kiri", g.transform, new Vector3(-0.3f, 0.68f, -1.36f), new Vector3(0.07f, 1.1f, 0.05f), "tinta", 0f);
            Box("palang-kanan", g.transform, new Vector3(0.3f, 0.68f, -1.36f), new Vector3(0.07f, 1.1f, 0.05f), "tinta", 0f);
            return g;
        }

        private static GameObject MakeKapal()
        {
            GameObject g = new GameObject("kapal");
            Box("lambung-bawah", g.transform, new Vector3(0f, 0.3f, 0f), new Vector3(1.8f, 0.6f, 4.6f), "aspal", 0f);
            Box("lambung", g.transform, new Vector3(0f, 0.85f, 0f), new Vector3(2.0f, 0.6f, 5.0f), "putih", 0f);
            Box("garis-air", g.transform, new Vector3(0f, 0.6f, 0f), new Vector3(2.04f, 0.14f, 4.8f), "karat", 0f);
            Box("dek", g.transform, new Vector3(0f, 1.18f, 0f), new Vector3(1.9f, 0.1f, 4.8f), "beton", 0f);
            Box("haluan", g.transform, new Vector3(0f, 0.85f, -2.6f), new Vector3(1.0f, 0.6f, 0.6f), "putih", 0f);
            Box("jembatan", g.transform, new Vector3(0f, 1.62f, 1.5f), new Vector3(1.5f, 0.8f, 1.2f), "krem", 0f);
            Box("jendela", g.transform, new Vector3(0f, 1.78f, 0.88f), new Vector3(1.3f, 0.3f, 0.06f), "kaca", 0f);
            Cyl("corong", g.transform, new Vector3(0f, 2.35f, 1.7f), 0.4f, 0.7f, "karat");
            Box("muatan-bawah", g.transform, new Vector3(0f, 1.5f, -0.8f), new Vector3(1.4f, 0.55f, 1.8f), "hijau", 0f);
            Box("muatan-atas", g.transform, new Vector3(0f, 2.0f, -0.8f), new Vector3(1.3f, 0.5f, 1.6f), "kuning-tua", 0f);
            return g;
        }

        private static GameObject MakeMejaKerja()
        {
            GameObject g = new GameObject("meja-kerja");
            Shadow(g.transform, Vector3.zero, 1.8f, "tinta");
            Box("papan", g.transform, new Vector3(0f, 0.74f, 0f), new Vector3(1.6f, 0.09f, 0.9f), "cokelat", 0f);
            for (int i = 0; i < 4; i++)
            {
                float x = (i < 2) ? -0.7f : 0.7f;
                float z = (i % 2 == 0) ? -0.36f : 0.36f;
                Box("kaki-" + i, g.transform, new Vector3(x, 0.36f, z), new Vector3(0.09f, 0.72f, 0.09f), "aspal", 0f);
            }
            Box("kaki-monitor", g.transform, new Vector3(0.1f, 0.86f, 0.22f), new Vector3(0.2f, 0.16f, 0.14f), "aspal", 0f);
            Box("monitor", g.transform, new Vector3(0.1f, 1.14f, 0.26f), new Vector3(0.74f, 0.44f, 0.06f), "tinta", 0f);
            Box("layar", g.transform, new Vector3(0.1f, 1.14f, 0.21f), new Vector3(0.66f, 0.36f, 0.03f), "kaca", 0f);
            Box("kibor", g.transform, new Vector3(0.1f, 0.8f, -0.16f), new Vector3(0.54f, 0.04f, 0.2f), "krem", 0f);
            Box("tumpukan-kertas", g.transform, new Vector3(-0.52f, 0.81f, -0.06f), new Vector3(0.3f, 0.05f, 0.22f), "putih", 0f);
            Cyl("gelas", g.transform, new Vector3(-0.5f, 0.85f, 0.26f), 0.14f, 0.18f, "putih");
            return g;
        }

        /// <summary>Karakter petugas pemain. CharacterMover sudah terpasang &amp; terisi.</summary>
        private static GameObject MakePetugas()
        {
            GameObject g = new GameObject("petugas");
            GameObject visual = Node("visual", g.transform, Vector3.zero);
            Transform v = visual.transform;
            Shadow(v, Vector3.zero, 0.95f, "tinta");
            Box("kaki-kiri", v, new Vector3(-0.12f, 0.4f, 0f), new Vector3(0.16f, 0.8f, 0.2f), "tinta", 0f);
            Box("kaki-kanan", v, new Vector3(0.12f, 0.4f, 0f), new Vector3(0.16f, 0.8f, 0.2f), "tinta", 0f);
            Box("sepatu-kiri", v, new Vector3(-0.12f, 0.05f, -0.06f), new Vector3(0.18f, 0.1f, 0.3f), "cokelat", 0f);
            Box("sepatu-kanan", v, new Vector3(0.12f, 0.05f, -0.06f), new Vector3(0.18f, 0.1f, 0.3f), "cokelat", 0f);
            GameObject badan = Box("badan", v, new Vector3(0f, 1.08f, 0f), new Vector3(0.48f, 0.64f, 0.3f), "hijau", 0f);
            Box("lengan-kiri", v, new Vector3(-0.32f, 1.04f, -0.02f), new Vector3(0.14f, 0.54f, 0.19f), "hijau", 0f);
            Box("lengan-kanan", v, new Vector3(0.32f, 1.04f, -0.02f), new Vector3(0.14f, 0.54f, 0.19f), "hijau", 0f);
            Box("tangan-kiri", v, new Vector3(-0.32f, 0.74f, -0.02f), new Vector3(0.15f, 0.15f, 0.2f), "krem", 0f);
            Box("tangan-kanan", v, new Vector3(0.32f, 0.74f, -0.02f), new Vector3(0.15f, 0.15f, 0.2f), "krem", 0f);
            GameObject kepala = Ball("kepala", v, new Vector3(0f, 1.56f, 0f), 0.34f, "krem");
            GameObject rambut = Cyl("rambut", v, new Vector3(0f, 1.7f, 0.01f), 0.35f, 0.14f, "tinta");
            Badge("mata-kiri", v, new Vector3(-0.08f, 1.58f, -0.17f), 0.07f, 0.03f, "tinta");
            Badge("mata-kanan", v, new Vector3(0.08f, 1.58f, -0.17f), 0.07f, 0.03f, "tinta");
            Box("senyum", v, new Vector3(0f, 1.47f, -0.17f), new Vector3(0.12f, 0.03f, 0.02f), "tinta", 0f);
            Box("tanda-pengenal", v, new Vector3(0.14f, 1.12f, -0.16f), new Vector3(0.14f, 0.18f, 0.03f), "krem", 0f);

            GameObject helm = Node("helm", v, new Vector3(0f, 1.74f, 0f));
            Cyl("kubah", helm.transform, Vector3.zero, 0.38f, 0.2f, "kuning");
            Plate("tepi", helm.transform, new Vector3(0f, -0.08f, 0f), 0.5f, 0.06f, "kuning");
            Box("rusuk", helm.transform, new Vector3(0f, 0.1f, 0f), new Vector3(0.08f, 0.06f, 0.38f), "kuning-tua", 0f);
            helm.SetActive(false);

            GameObject jaket = Node("jaket", v, new Vector3(0f, 1.08f, 0f));
            Box("badan-jaket", jaket.transform, Vector3.zero, new Vector3(0.56f, 0.7f, 0.36f), "kuning", 0f);
            Box("pita-jaket", jaket.transform, new Vector3(0f, 0.08f, -0.19f), new Vector3(0.56f, 0.09f, 0.02f), "krem", 0f);
            jaket.SetActive(false);

            GameObject headset = Node("headset", v, new Vector3(0f, 1.66f, 0f));
            CylE("ikat", headset.transform, Vector3.zero, 0.38f, 0.06f, "tinta", new Vector3(0f, 0f, 90f));
            Box("telinga-kiri", headset.transform, new Vector3(-0.19f, -0.06f, 0f), new Vector3(0.07f, 0.14f, 0.14f), "tinta", 0f);
            Box("telinga-kanan", headset.transform, new Vector3(0.19f, -0.06f, 0f), new Vector3(0.07f, 0.14f, 0.14f), "tinta", 0f);
            Box("mikrofon", headset.transform, new Vector3(-0.1f, -0.14f, -0.14f), new Vector3(0.05f, 0.05f, 0.2f), "tinta", 0f);
            headset.SetActive(false);

            GameObject topi = Node("topi", v, new Vector3(0f, 1.72f, 0f));
            Cyl("mahkota", topi.transform, Vector3.zero, 0.36f, 0.16f, "hijau");
            Box("lidah", topi.transform, new Vector3(0f, -0.05f, -0.2f), new Vector3(0.3f, 0.05f, 0.24f), "hijau-tua", 0f);
            topi.SetActive(false);

            CharacterMover mover = g.AddComponent<CharacterMover>();
            mover.visual = v;
            mover.uniformRenderer = badan != null ? badan.GetComponent<Renderer>() : null;
            mover.skinRenderer = kepala != null ? kepala.GetComponent<Renderer>() : null;
            mover.hairRenderer = rambut != null ? rambut.GetComponent<Renderer>() : null;
            mover.helm = helm;
            mover.jaket = jaket;
            mover.headset = headset;
            mover.topi = topi;
            mover.walkSeconds = 1.1f;
            mover.bobHeight = 0.06f;
            return g;
        }

        /// <summary>Maskot Raki: bulat, ramah, hadir di setiap diorama.</summary>
        private static GameObject MakeRaki()
        {
            GameObject g = new GameObject("raki");
            Shadow(g.transform, Vector3.zero, 0.8f, "tinta");
            Box("kaki-kiri", g.transform, new Vector3(-0.13f, 0.09f, -0.02f), new Vector3(0.16f, 0.18f, 0.24f), "kuning-tua", 0f);
            Box("kaki-kanan", g.transform, new Vector3(0.13f, 0.09f, -0.02f), new Vector3(0.16f, 0.18f, 0.24f), "kuning-tua", 0f);
            Cyl("badan", g.transform, new Vector3(0f, 0.42f, 0f), 0.52f, 0.5f, "hijau");
            Box("dada", g.transform, new Vector3(0f, 0.44f, -0.24f), new Vector3(0.26f, 0.26f, 0.06f), "krem", 0f);
            Box("lengan-kiri", g.transform, new Vector3(-0.3f, 0.46f, -0.02f), new Vector3(0.12f, 0.3f, 0.14f), "hijau", 0f);
            Box("lengan-kanan", g.transform, new Vector3(0.3f, 0.52f, -0.02f), new Vector3(0.12f, 0.3f, 0.14f), "hijau", 0f);
            Ball("kepala", g.transform, new Vector3(0f, 0.86f, 0f), 0.52f, "kuning");
            Badge("mata-kiri", g.transform, new Vector3(-0.11f, 0.9f, -0.25f), 0.1f, 0.04f, "tinta");
            Badge("mata-kanan", g.transform, new Vector3(0.11f, 0.9f, -0.25f), 0.1f, 0.04f, "tinta");
            Box("senyum", g.transform, new Vector3(0f, 0.76f, -0.24f), new Vector3(0.18f, 0.04f, 0.03f), "tinta", 0f);
            Cyl("topi", g.transform, new Vector3(0f, 1.1f, 0f), 0.4f, 0.14f, "hijau-tua");
            Box("lidah-topi", g.transform, new Vector3(0f, 1.05f, -0.22f), new Vector3(0.3f, 0.05f, 0.2f), "hijau-tua", 0f);
            return g;
        }

        private static GameObject MakePapanNama()
        {
            GameObject g = new GameObject("papan-nama");
            Shadow(g.transform, Vector3.zero, 0.9f, "tinta");
            Cyl("tiang-kiri", g.transform, new Vector3(-0.55f, 0.6f, 0f), 0.1f, 1.2f, "cokelat");
            Cyl("tiang-kanan", g.transform, new Vector3(0.55f, 0.6f, 0f), 0.1f, 1.2f, "cokelat");
            Box("papan", g.transform, new Vector3(0f, 1.42f, 0f), new Vector3(1.6f, 0.66f, 0.12f), "hijau", 0f);
            Box("muka", g.transform, new Vector3(0f, 1.42f, -0.07f), new Vector3(1.42f, 0.5f, 0.05f), "krem", 0f);
            Box("baris-1", g.transform, new Vector3(-0.12f, 1.52f, -0.11f), new Vector3(1.0f, 0.08f, 0.03f), "hijau-tua", 0f);
            Box("baris-2", g.transform, new Vector3(-0.28f, 1.36f, -0.11f), new Vector3(0.68f, 0.07f, 0.03f), "kuning-tua", 0f);
            Box("pita-atas", g.transform, new Vector3(0f, 1.78f, 0f), new Vector3(1.66f, 0.1f, 0.16f), "kuning", 0f);
            return g;
        }

        // ------------------------------------------------------------- penanda

        /// <summary>
        /// Penanda tap: cincin (kuning - tinta - piring krem) + nomor tujuh segmen.
        /// Bentuk cincin &amp; nomor jadi penanda utama, jadi tidak bergantung warna saja.
        /// Highlight = cincin lebih besar di belakang, muncul saat objek terpilih.
        /// Sisi +Z penanda diarahkan ke kamera, jadi lapisan depan ber-z negatif.
        /// </summary>
        private static GameObject MakeMarker()
        {
            GameObject g = new GameObject("marker");
            GameObject hl = Badge("highlight", g.transform, new Vector3(0f, 0f, -0.08f), MarkerDiameter + 0.45f, 0.07f, "hijau");
            hl.SetActive(false);
            Badge("cincin", g.transform, Vector3.zero, MarkerDiameter, 0.1f, "kuning");
            Badge("cincin-dalam", g.transform, new Vector3(0f, 0f, 0.03f), MarkerDiameter - 0.16f, 0.08f, "tinta");
            Badge("piring", g.transform, new Vector3(0f, 0f, 0.055f), MarkerDiameter - 0.3f, 0.07f, "krem");
            Node("angka", g.transform, new Vector3(0f, 0f, 0.09f));
            return g;
        }

        private static Transform SpawnMarker(Transform parent, Vector3 local, int number)
        {
            GameObject pf;
            if (_prefabs == null || !_prefabs.TryGetValue("marker", out pf) || pf == null)
            {
                Debug.LogError("[Raksa] prefab marker tidak ada.");
                return null;
            }
            // Salinan biasa (bukan instance prefab) supaya nomor bisa ditambahkan tanpa override.
            GameObject go = UnityEngine.Object.Instantiate(pf);
            go.name = "penanda";
            go.transform.SetParent(parent, false);
            go.transform.localPosition = local;
            go.transform.localScale = Vector3.one;
            Transform slot = go.transform.Find("angka");
            if (slot != null) BuildNumber(slot, number);
            return go.transform;
        }

        /// <summary>Pola tujuh segmen: a atas, b kanan-atas, c kanan-bawah, d bawah, e kiri-bawah, f kiri-atas, g tengah.</summary>
        private static readonly string[] SevenSeg = new string[]
        {
            "abcdef", "bc", "abdeg", "abcdg", "bcfg", "acdfg", "acdefg", "abc", "abcdefg", "abcdfg"
        };

        private static void BuildNumber(Transform slot, int number)
        {
            if (number < 0) number = 0;
            string teks = number.ToString();
            float lebar = 0.28f;
            float x0 = -(teks.Length - 1) * lebar * 0.5f;
            for (int i = 0; i < teks.Length; i++)
            {
                int digit = teks[i] - '0';
                if (digit < 0 || digit > 9) continue;
                BuildDigit(slot, new Vector3(x0 + i * lebar, 0f, 0f), SevenSeg[digit]);
            }
        }

        private static void BuildDigit(Transform parent, Vector3 pos, string segmen)
        {
            float w = 0.2f;
            float h = 0.42f;
            float s = 0.07f;
            for (int i = 0; i < segmen.Length; i++)
            {
                Vector3 p;
                Vector3 size;
                switch (segmen[i])
                {
                    case 'a': p = new Vector3(0f, h * 0.5f, 0f); size = new Vector3(w, s, s); break;
                    case 'g': p = new Vector3(0f, 0f, 0f); size = new Vector3(w, s, s); break;
                    case 'd': p = new Vector3(0f, -h * 0.5f, 0f); size = new Vector3(w, s, s); break;
                    case 'b': p = new Vector3(w * 0.5f, h * 0.25f, 0f); size = new Vector3(s, h * 0.5f, s); break;
                    case 'c': p = new Vector3(w * 0.5f, -h * 0.25f, 0f); size = new Vector3(s, h * 0.5f, s); break;
                    case 'f': p = new Vector3(-w * 0.5f, h * 0.25f, 0f); size = new Vector3(s, h * 0.5f, s); break;
                    case 'e': p = new Vector3(-w * 0.5f, -h * 0.25f, 0f); size = new Vector3(s, h * 0.5f, s); break;
                    default: continue;
                }
                Box("seg-" + segmen[i], parent, pos + p, size, "tinta", 0f);
            }
        }

        // ----------------------------------------------- bentuk objek tappable

        /// <summary>Bentuk fisik objek yang dapat diketuk. Sisi depan menghadap -Z.</summary>
        private static void TapBody(Transform p, string kind)
        {
            switch (kind)
            {
                case "pin":
                    // Hotspot: penanda saja; objek ceritanya berdiri sendiri di dekatnya.
                    break;

                case "papan":
                    Cyl("tiang", p, new Vector3(0f, -0.78f, 0.07f), 0.11f, 1.1f, "aspal");
                    Box("rangka", p, new Vector3(0f, 0f, 0.07f), new Vector3(1.62f, 1.16f, 0.1f), "hijau", 0f);
                    Box("muka", p, new Vector3(0f, 0.02f, 0f), new Vector3(1.44f, 0.96f, 0.06f), "krem", 0f);
                    Box("garis", p, new Vector3(0f, -0.36f, -0.04f), new Vector3(1.1f, 0.08f, 0.03f), "kuning-tua", 0f);
                    break;

                case "kartu":
                    Box("rangka", p, new Vector3(0f, 0f, 0.05f), new Vector3(1.36f, 1.76f, 0.09f), "putih", 0f);
                    Box("kepala", p, new Vector3(0f, 0.68f, 0f), new Vector3(1.22f, 0.32f, 0.05f), "hijau", 0f);
                    for (int i = 0; i < 3; i++)
                    {
                        Box("baris-" + i, p, new Vector3(-0.1f, 0.2f - i * 0.3f, 0f), new Vector3(0.9f, 0.09f, 0.04f), "beton", 0f);
                    }
                    Box("cap", p, new Vector3(0.38f, -0.6f, 0f), new Vector3(0.36f, 0.24f, 0.04f), "kuning", 0f);
                    break;

                case "foto":
                    Box("rangka", p, new Vector3(0f, 0f, 0.05f), new Vector3(1.4f, 1.1f, 0.08f), "putih", 0f);
                    Box("gambar", p, new Vector3(0f, 0.06f, 0f), new Vector3(1.2f, 0.82f, 0.04f), "kaca", 0f);
                    Box("isi-gambar", p, new Vector3(-0.2f, -0.02f, -0.03f), new Vector3(0.6f, 0.4f, 0.03f), "beton", 0f);
                    Box("kaki", p, new Vector3(0f, -0.58f, 0.16f), new Vector3(0.5f, 0.1f, 0.34f), "beton", 0f);
                    break;

                case "dokumen":
                    BoxE("kertas", p, new Vector3(0f, 0f, 0.03f), new Vector3(1.06f, 1.4f, 0.05f), "putih", new Vector3(-12f, 0f, 0f));
                    BoxE("kepala-kertas", p, new Vector3(0f, 0.48f, -0.07f), new Vector3(0.82f, 0.14f, 0.03f), "hijau", new Vector3(-12f, 0f, 0f));
                    for (int i = 0; i < 4; i++)
                    {
                        BoxE("baris-" + i, p, new Vector3(-0.06f, 0.18f - i * 0.24f, -0.06f), new Vector3(0.74f, 0.07f, 0.03f), "beton", new Vector3(-12f, 0f, 0f));
                    }
                    Box("klip", p, new Vector3(0.36f, 0.6f, -0.1f), new Vector3(0.14f, 0.26f, 0.06f), "aspal", 0f);
                    break;

                case "helm":
                    KartuKecil(p);
                    Cyl("helm", p, new Vector3(0f, -0.04f, -0.14f), 0.4f, 0.22f, "kuning");
                    Plate("helm-tepi", p, new Vector3(0f, -0.14f, -0.14f), 0.54f, 0.06f, "kuning");
                    Box("helm-rusuk", p, new Vector3(0f, 0.08f, -0.14f), new Vector3(0.08f, 0.06f, 0.4f), "kuning-tua", 0f);
                    break;

                case "kopi":
                    KartuKecil(p);
                    Cyl("gelas", p, new Vector3(0f, -0.06f, -0.14f), 0.3f, 0.34f, "putih");
                    Cyl("tutup", p, new Vector3(0f, 0.12f, -0.14f), 0.34f, 0.07f, "cokelat");
                    Box("pegangan", p, new Vector3(0.2f, -0.06f, -0.14f), new Vector3(0.12f, 0.16f, 0.06f), "putih", 0f);
                    Box("pita-gelas", p, new Vector3(0f, -0.1f, -0.14f), new Vector3(0.32f, 0.08f, 0.32f), "kuning-tua", 0f);
                    break;

                case "kucing":
                    KartuKecil(p);
                    Box("badan", p, new Vector3(0f, -0.14f, -0.14f), new Vector3(0.44f, 0.24f, 0.3f), "beton", 0f);
                    Cyl("kepala", p, new Vector3(-0.16f, 0.06f, -0.16f), 0.26f, 0.24f, "beton");
                    Box("telinga-kiri", p, new Vector3(-0.24f, 0.2f, -0.16f), new Vector3(0.08f, 0.1f, 0.06f), "beton", 0f);
                    Box("telinga-kanan", p, new Vector3(-0.08f, 0.2f, -0.16f), new Vector3(0.08f, 0.1f, 0.06f), "beton", 0f);
                    Box("ekor", p, new Vector3(0.24f, -0.02f, -0.14f), new Vector3(0.07f, 0.28f, 0.07f), "beton", 0f);
                    break;

                case "panel":
                    Box("panel", p, new Vector3(0f, 0f, 0.05f), new Vector3(1.3f, 1.0f, 0.12f), "kuning-tua", 0f);
                    Box("penyok-1", p, new Vector3(-0.2f, 0.1f, -0.03f), new Vector3(0.5f, 0.3f, 0.07f), "karat", 0f);
                    Box("penyok-2", p, new Vector3(0.24f, -0.22f, -0.03f), new Vector3(0.34f, 0.2f, 0.06f), "karat", 0f);
                    Box("baut-kiri", p, new Vector3(-0.54f, -0.36f, -0.03f), new Vector3(0.1f, 0.1f, 0.06f), "beton", 0f);
                    Box("baut-kanan", p, new Vector3(0.54f, 0.36f, -0.03f), new Vector3(0.1f, 0.1f, 0.06f), "beton", 0f);
                    break;

                case "catatan":
                    Box("papan-jepit", p, new Vector3(0f, 0f, 0.05f), new Vector3(1.0f, 1.4f, 0.07f), "cokelat", 0f);
                    Box("kertas", p, new Vector3(0f, -0.04f, 0f), new Vector3(0.86f, 1.2f, 0.04f), "krem", 0f);
                    Box("jepit", p, new Vector3(0f, 0.62f, -0.02f), new Vector3(0.44f, 0.16f, 0.08f), "beton", 0f);
                    for (int i = 0; i < 5; i++)
                    {
                        Box("baris-" + i, p, new Vector3(-0.04f, 0.3f - i * 0.22f, -0.03f), new Vector3(0.62f, 0.06f, 0.03f), "aspal", 0f);
                    }
                    break;

                case "mesin":
                    Box("rumah-mesin", p, new Vector3(0f, -0.1f, 0.05f), new Vector3(1.2f, 0.9f, 0.7f), "aspal", 0f);
                    Box("tutup", p, new Vector3(0f, 0.42f, 0.16f), new Vector3(1.24f, 0.1f, 0.8f), "kuning-tua", -14f);
                    Cyl("pipa-kiri", p, new Vector3(-0.3f, 0.1f, -0.2f), 0.18f, 0.6f, "karat");
                    Cyl("pipa-kanan", p, new Vector3(0.28f, 0.02f, -0.2f), 0.14f, 0.44f, "beton");
                    Box("kabel", p, new Vector3(0.1f, -0.3f, -0.3f), new Vector3(0.6f, 0.08f, 0.08f), "tinta", 0f);
                    break;

                default:
                    Debug.LogWarning("[Raksa] bentuk tappable tidak dikenal: " + kind + " (dipakai papan).");
                    TapBody(p, "papan");
                    break;
            }
        }

        /// <summary>Kartu kecil untuk objek latihan (helm / kopi / kucing).</summary>
        private static void KartuKecil(Transform p)
        {
            Box("tepi", p, new Vector3(0f, 0f, 0.13f), new Vector3(1.3f, 1.42f, 0.06f), "hijau", 0f);
            Box("rangka", p, new Vector3(0f, 0f, 0.09f), new Vector3(1.18f, 1.3f, 0.09f), "krem", 0f);
            Box("dudukan", p, new Vector3(0f, -0.4f, -0.1f), new Vector3(0.8f, 0.08f, 0.3f), "kuning-tua", 0f);
        }
    }
}
