using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Raksa.EditorTools
{
    /// <summary>
    /// Pengaturan proyek + build Web untuk RAKSA GAME.
    ///
    /// Dari editor : menu Raksa > Terapkan Pengaturan Web / Build Web
    /// Dari CLI    : lihat unity/build.ps1 (memakai -executeMethod)
    ///
    /// Target: HP kelas menengah lewat browser. Karena itu color space Gamma,
    /// WebGL2 saja, stripping tinggi, tanpa exception support, bayangan ringan.
    /// </summary>
    public static class RaksaBuildWeb
    {
        public const string GameScenePath = "Assets/Scenes/RaksaGame.unity";
        private const string DefaultOutput = "Build/Web";

        [MenuItem("Raksa/1. Terapkan Pengaturan Web", false, 20)]
        public static void ApplySettingsMenu()
        {
            ApplySettings();
            AssetDatabase.SaveAssets();
            Debug.Log("[Raksa] Pengaturan Web diterapkan.");
        }

        [MenuItem("Raksa/3. Build Web", false, 22)]
        public static void BuildMenu()
        {
            var report = Build(ResolveOutput(null), false);
            if (report == null) return;
            EditorUtility.RevealInFinder(ResolveOutput(null));
        }

        /// <summary>Dipanggil dari command line: -executeMethod Raksa.EditorTools.RaksaBuildWeb.BuildFromCommandLine</summary>
        public static void BuildFromCommandLine()
        {
            string output = null;
            bool brotli = false;
            bool noFallback = false;

            var args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "-raksaOutput" && i + 1 < args.Length) output = args[i + 1];
                else if (args[i] == "-raksaBrotli") brotli = true;
                else if (args[i] == "-raksaNoFallback") noFallback = true;
            }

            // Scene dibuat prosedural bila belum ada, supaya build CLI bisa jalan
            // di mesin bersih tanpa langkah manual.
            if (!File.Exists(GameScenePath))
            {
                Debug.Log("[Raksa] Scene belum ada, menjalankan generator...");
                // Validasi generator WAJIB diperiksa: kalau ada anchor misi yang tidak
                // punya objek di diorama, build tidak boleh dilanjutkan diam-diam.
                if (!RaksaSceneGenerator.GenerateAll())
                {
                    Debug.LogError("[Raksa] Generator diorama gagal validasi. Build dibatalkan.");
                    EditorApplication.Exit(1);
                    return;
                }
            }

            var report = Build(ResolveOutput(output), brotli, !noFallback);
            bool ok = report != null && report.summary.result == BuildResult.Succeeded;
            if (!ok)
            {
                Debug.LogError("[Raksa] Build Web GAGAL.");
                EditorApplication.Exit(1);
                return;
            }
            Debug.Log("[Raksa] Build Web berhasil: " + report.summary.totalSize + " bytes (belum terkompresi).");
            EditorApplication.Exit(0);
        }

        private static string ResolveOutput(string arg)
        {
            if (!string.IsNullOrEmpty(arg))
            {
                return Path.IsPathRooted(arg) ? arg : Path.GetFullPath(arg);
            }
            return Path.GetFullPath(DefaultOutput);
        }

        public static void ApplySettings(bool brotli = false, bool decompressionFallback = true)
        {
            PlayerSettings.companyName = "PT Asuransi Raksa Pratikara";
            PlayerSettings.productName = "RAKSA GAME";
            PlayerSettings.colorSpace = ColorSpace.Gamma;
            PlayerSettings.runInBackground = false;

            // Hanya WebGL2: lebih cepat dan didukung browser HP modern.
            PlayerSettings.SetGraphicsAPIs(
                BuildTarget.WebGL,
                new[] { UnityEngine.Rendering.GraphicsDeviceType.OpenGLES3 });

            PlayerSettings.SetManagedStrippingLevel(
                UnityEditor.Build.NamedBuildTarget.WebGL, ManagedStrippingLevel.High);
            PlayerSettings.stripEngineCode = true;

            PlayerSettings.WebGL.compressionFormat = brotli
                ? WebGLCompressionFormat.Brotli
                : WebGLCompressionFormat.Gzip;
            // Fallback dinyalakan agar build tetap dimuat bila server panitia
            // tidak mengirim header Content-Encoding. Matikan (-raksaNoFallback)
            // untuk ukuran lebih kecil bila server sudah benar.
            PlayerSettings.WebGL.decompressionFallback = decompressionFallback;
            PlayerSettings.WebGL.linkerTarget = WebGLLinkerTarget.Wasm;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.debugSymbolMode = WebGLDebugSymbolMode.Off;
            PlayerSettings.WebGL.template = "APPLICATION:Minimal";
            PlayerSettings.WebGL.powerPreference = WebGLPowerPreference.Default;

            // React yang menyediakan canvas & UI, jadi Unity tidak perlu
            // menangkap keyboard atau menampilkan tombol fullscreen.
            PlayerSettings.WebGL.showDiagnostics = false;

            QualitySettings.vSyncCount = 0;

            var scenes = new List<EditorBuildSettingsScene>();
            if (File.Exists(GameScenePath))
            {
                scenes.Add(new EditorBuildSettingsScene(GameScenePath, true));
            }
            EditorBuildSettings.scenes = scenes.ToArray();
        }

        public static BuildReport Build(string outputPath, bool brotli, bool decompressionFallback = true)
        {
            ApplySettings(brotli, decompressionFallback);

            if (!File.Exists(GameScenePath))
            {
                Debug.LogError("[Raksa] Scene tidak ditemukan: " + GameScenePath +
                               ". Jalankan menu Raksa > 2. Generate Diorama lebih dulu.");
                return null;
            }

            Directory.CreateDirectory(outputPath);

            var options = new BuildPlayerOptions
            {
                scenes = new[] { GameScenePath },
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None,
            };

            Debug.Log("[Raksa] Build Web -> " + outputPath +
                      " (kompresi " + (brotli ? "brotli" : "gzip") +
                      ", fallback " + (decompressionFallback ? "on" : "off") + ")");

            var report = BuildPipeline.BuildPlayer(options);
            if (report != null && report.summary.result == BuildResult.Succeeded)
            {
                LaporkanUkuran(outputPath);
            }
            return report;
        }

        /// <summary>Laporkan ukuran file yang benar-benar diunduh peserta.</summary>
        private static void LaporkanUkuran(string outputPath)
        {
            try
            {
                var dir = new DirectoryInfo(outputPath);
                if (!dir.Exists) return;
                long total = 0;
                var baris = new List<string>();
                foreach (var f in dir.GetFiles("*", SearchOption.AllDirectories))
                {
                    // File .unityweb/.gz/.br adalah yang benar-benar diunduh.
                    total += f.Length;
                    if (f.Length > 256 * 1024)
                    {
                        baris.Add("  " + f.Name + " = " + (f.Length / 1024) + " KB");
                    }
                }
                baris.Sort();
                Debug.Log("[Raksa] Total isi folder build = " + (total / 1024 / 1024) + " MB\n" +
                          string.Join("\n", baris.ToArray()) +
                          "\n[Raksa] Target unduhan awal < 20 MB. Bila lebih, kurangi tekstur/mesh atau pakai -raksaBrotli.");
            }
            catch (Exception e)
            {
                Debug.LogWarning("[Raksa] gagal menghitung ukuran build: " + e.Message);
            }
        }
    }
}
