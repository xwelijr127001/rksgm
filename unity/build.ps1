<#
  Build Unity Web untuk RAKSA GAME (Windows).

  Pemakaian:
    npm run unity:build
    powershell -ExecutionPolicy Bypass -File unity/build.ps1 -Brotli
    powershell -ExecutionPolicy Bypass -File unity/build.ps1 -UnityPath "C:\Program Files\Unity\Hub\Editor\6000.3.10f1\Editor\Unity.exe"

  Hasil build: unity/Build/Web  (disajikan server di /unity/)
#>
[CmdletBinding()]
param(
  [string]$UnityPath = $env:RAKSA_UNITY,
  [string]$Output = "",
  [switch]$Brotli,
  [switch]$NoFallback,
  [switch]$GenerateOnly
)

$ErrorActionPreference = "Stop"
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
$logFile = Join-Path $projectPath "build-web.log"
if ([string]::IsNullOrWhiteSpace($Output)) { $Output = Join-Path $projectPath "Build\Web" }

function Find-Unity {
  if ($UnityPath -and (Test-Path $UnityPath)) { return $UnityPath }
  $roots = @(
    "C:\Program Files\Unity\Hub\Editor",
    "C:\Program Files (x86)\Unity\Hub\Editor",
    "D:\Unity\Hub\Editor"
  )
  $pinned = (Get-Content (Join-Path $projectPath "ProjectSettings\ProjectVersion.txt") -ErrorAction SilentlyContinue |
    Where-Object { $_ -match "m_EditorVersion:" }) -replace "m_EditorVersion:\s*", ""
  $pinned = $pinned.Trim()

  $candidates = @()
  foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    foreach ($d in Get-ChildItem $r -Directory -ErrorAction SilentlyContinue) {
      $exe = Join-Path $d.FullName "Editor\Unity.exe"
      if (-not (Test-Path $exe)) { continue }
      # Modul Web wajib ada untuk build; editor tanpa modul ini akan gagal
      # dengan pesan yang membingungkan, jadi dicek di sini.
      $web = Test-Path (Join-Path $d.FullName "Editor\Data\PlaybackEngines\WebGLSupport")
      $candidates += [pscustomobject]@{ Version = $d.Name; Path = $exe; Web = $web }
    }
  }
  if ($candidates.Count -eq 0) { return $null }

  # Untuk generate scene, modul Web tidak diperlukan.
  $perlWeb = -not $GenerateOnly
  $layak = if ($perlWeb) { $candidates | Where-Object { $_.Web } } else { $candidates }

  if ($perlWeb -and $layak.Count -eq 0) {
    Write-Host ""
    Write-Host "Unity terpasang, tetapi TIDAK ADA yang punya modul Web Build Support:" -ForegroundColor Red
    foreach ($c in ($candidates | Sort-Object Version)) {
      Write-Host ("  {0}  Web Build Support: {1}" -f $c.Version, $(if ($c.Web) { "ada" } else { "TIDAK ADA" }))
    }
    Write-Host ""
    Write-Host "Tambahkan modulnya:  unity install-modules -e <versi> -m webgl"
    Write-Host "atau di Unity Hub:   Installs > (tiga titik) > Add modules > Web Build Support"
    Write-Host ""
    return $null
  }

  $exact = $layak | Where-Object { $_.Version -eq $pinned } | Select-Object -First 1
  if ($exact) { return $exact.Path }
  # versi 6000.3.x lain masih kompatibel (stream LTS yang sama)
  $sameStream = $layak | Where-Object { $_.Version -like "6000.3.*" } | Sort-Object Version -Descending | Select-Object -First 1
  if ($sameStream) {
    Write-Warning "Versi pinned ($pinned) tidak terpasang. Memakai $($sameStream.Version)."
    return $sameStream.Path
  }
  $newest = $layak | Sort-Object Version -Descending | Select-Object -First 1
  Write-Warning "Tidak ada Unity 6000.3.x dengan modul Web. Memakai $($newest.Version)."
  Write-Warning "Untuk acara, 6.3 LTS lebih disarankan (didukung sampai Des 2027)."
  return $newest.Path
}

$unity = Find-Unity
if (-not $unity) {
  Write-Host ""
  Write-Host "Unity Editor tidak ditemukan." -ForegroundColor Red
  Write-Host ""
  Write-Host "Yang dibutuhkan:"
  Write-Host "  1. Unity Hub            : winget install Unity.UnityHub"
  Write-Host "  2. Unity 6000.3.x LTS + modul Web Build Support:"
  Write-Host "       unity install lts -m webgl"
  Write-Host "     (atau di Unity Hub: Installs > Add modules > WebGL Build Support)"
  Write-Host "  3. Lisensi Unity (Personal gratis) - harus disetujui lewat Unity Hub."
  Write-Host ""
  Write-Host "Sudah terpasang tetapi tidak terdeteksi? Set path-nya:"
  Write-Host '  $env:RAKSA_UNITY = "C:\Program Files\Unity\Hub\Editor\6000.3.10f1\Editor\Unity.exe"'
  Write-Host ""
  exit 2
}

Write-Host "Unity   : $unity"
Write-Host "Project : $projectPath"
Write-Host "Output  : $Output"
Write-Host "Log     : $logFile"
Write-Host ""

$method = if ($GenerateOnly) {
  "Raksa.EditorTools.RaksaSceneGenerator.GenerateFromCommandLine"
} else {
  "Raksa.EditorTools.RaksaBuildWeb.BuildFromCommandLine"
}

$unityArgs = @(
  "-batchmode", "-nographics", "-quit",
  "-projectPath", $projectPath,
  "-executeMethod", $method,
  "-logFile", $logFile,
  "-raksaOutput", $Output
)
if ($Brotli) { $unityArgs += "-raksaBrotli" }
if ($NoFallback) { $unityArgs += "-raksaNoFallback" }

Write-Host "Menjalankan Unity (batchmode). Build pertama bisa 10-30 menit..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $unity -ArgumentList $unityArgs -NoNewWindow -PassThru -Wait
$code = $proc.ExitCode

if ($code -ne 0) {
  Write-Host ""
  Write-Host "Build GAGAL (exit $code). Baris error terakhir dari log:" -ForegroundColor Red
  if (Test-Path $logFile) {
    Get-Content $logFile -Tail 400 | Where-Object { $_ -match "error|Error|Exception|failed|Failed" } | Select-Object -Last 25
  }
  exit $code
}

Write-Host ""
Write-Host "Build selesai." -ForegroundColor Green
if (-not $GenerateOnly) {
  if (Test-Path $Output) {
    $total = (Get-ChildItem $Output -Recurse -File | Measure-Object -Property Length -Sum).Sum
    Write-Host ("Ukuran folder build : {0:N1} MB" -f ($total / 1MB))
    Get-ChildItem (Join-Path $Output "Build") -File -ErrorAction SilentlyContinue |
      Sort-Object Length -Descending | Select-Object -First 8 |
      ForEach-Object { Write-Host ("  {0,-46} {1,8:N0} KB" -f $_.Name, ($_.Length / 1KB)) }
    Write-Host ""
    Write-Host "Server menyajikannya di /unity/ (lihat UNITY_BUILD_DIR di .env.example)."
  } else {
    Write-Warning "Folder output tidak ditemukan: $Output"
  }
}
