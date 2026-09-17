<#
  Pemeriksaan C# proyek Unity memakai Roslyn (csc.exe) dari Visual Studio Build Tools.

  Dua mode, dipilih otomatis:

  1. MODE API NYATA (bila Unity Editor terpasang)
     Kompilasi seluruh skrip dengan referensi assembly UnityEngine/UnityEditor yang
     sebenarnya. Ini menangkap pemakaian API yang salah: nama method keliru, jumlah
     argumen salah, enum tidak ada, dsb.
     Tetap BUKAN pengganti build Unity: Unity memakai compiler & define sendiri
     (mis. UNITY_EDITOR, UNITY_WEBGL) dan asmdef per folder.

  2. MODE SINTAKS (bila Unity tidak ada)
     Hanya memeriksa struktur/sintaks; error "tipe tidak ditemukan" diabaikan.

  Pemakaian:
    npm run check:csharp
    powershell -File tools/check-csharp.ps1 -UnityRoot "C:\Program Files\Unity\Hub\Editor\6000.6.1f1"
#>
[CmdletBinding()]
param(
  [string]$CscPath = "",
  [string]$UnityRoot = $env:RAKSA_UNITY_ROOT
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsPath = Join-Path $root "unity\Assets"

if (-not (Test-Path $assetsPath)) {
  Write-Host "Folder unity/Assets tidak ada - tidak ada yang diperiksa." -ForegroundColor Yellow
  exit 0
}

function Find-Csc {
  if ($CscPath -and (Test-Path $CscPath)) { return $CscPath }
  $cands = @()
  foreach ($base in @("C:\Program Files\Microsoft Visual Studio", "C:\Program Files (x86)\Microsoft Visual Studio")) {
    if (-not (Test-Path $base)) { continue }
    $cands += Get-ChildItem $base -Recurse -Filter "csc.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match "Roslyn" } | Select-Object -ExpandProperty FullName
  }
  if ($cands.Count -gt 0) { return ($cands | Sort-Object -Descending | Select-Object -First 1) }
  return $null
}

function Find-UnityRoot {
  if ($UnityRoot -and (Test-Path (Join-Path $UnityRoot "Editor\Data\Managed\UnityEngine"))) { return $UnityRoot }
  $hub = "C:\Program Files\Unity\Hub\Editor"
  if (-not (Test-Path $hub)) { return $null }
  # Pilih editor yang punya folder Managed/UnityEngine, versi tertinggi lebih dulu.
  foreach ($d in (Get-ChildItem $hub -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
    if (Test-Path (Join-Path $d.FullName "Editor\Data\Managed\UnityEngine")) { return $d.FullName }
  }
  return $null
}

$csc = Find-Csc
if (-not $csc) {
  Write-Host "csc.exe (Roslyn) tidak ditemukan - pemeriksaan dilewati." -ForegroundColor Yellow
  exit 0
}

$files = Get-ChildItem $assetsPath -Recurse -Filter "*.cs" | Select-Object -ExpandProperty FullName
if ($files.Count -eq 0) { Write-Host "Tidak ada file .cs."; exit 0 }

$unity = Find-UnityRoot
$refs = @()
$netstandard = $null
if ($unity) {
  # Unity menargetkan netstandard 2.1. Pakai reference assembly milik Unity sendiri
  # supaya tidak bentrok dengan profil .NET Framework bawaan csc.
  $ns = Join-Path $unity "Editor\Data\NetStandard\ref\2.1.0\netstandard.dll"
  if (Test-Path $ns) { $netstandard = $ns }
  $managed = Join-Path $unity "Editor\Data\Managed"
  $ue = Join-Path $managed "UnityEngine"
  $refs += Get-ChildItem $ue -Filter "*.dll" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  foreach ($n in @("UnityEditor.dll", "UnityEditor.CoreModule.dll")) {
    $p = Join-Path $managed $n
    if (Test-Path $p) { $refs += $p }
  }
  # Modul editor tambahan (mis. UnityEditor.UIBuilderModule) bila ada.
  $refs += Get-ChildItem $managed -Filter "UnityEditor.*.dll" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
  $refs = $refs | Sort-Object -Unique
}

Write-Host "csc     : $csc"
Write-Host "file    : $($files.Count) berkas C#"
if ($unity) {
  Write-Host "mode    : API NYATA (Unity di $unity)" -ForegroundColor Green
  Write-Host "refs    : $($refs.Count) assembly Unity"
  if ($netstandard) { Write-Host "netstd  : netstandard 2.1 milik Unity" } else { Write-Host "netstd  : TIDAK ADA - profil .NET bisa bentrok" -ForegroundColor Yellow }
} else {
  Write-Host "mode    : SINTAKS saja (Unity Editor tidak ditemukan)" -ForegroundColor Yellow
}
Write-Host ""

$outDll = Join-Path $env:TEMP ("raksa-cs-" + [System.Guid]::NewGuid().ToString("N") + ".dll")
$argList = @("/nologo", "/target:library", "/langversion:9", "/warn:0", "/unsafe-", "/out:$outDll")
if ($unity -and $netstandard) {
  # Tanpa stdlib bawaan csc: seluruh tipe dasar diambil dari netstandard 2.1 Unity.
  $argList += "/nostdlib+"
  $argList += "/noconfig"
  $argList += "/reference:$netstandard"
}
if ($unity) {
  # Define yang dipakai Unity saat mengompilasi skrip Editor + build Web.
  $argList += "/define:UNITY_EDITOR;UNITY_EDITOR_WIN;UNITY_2021_1_OR_NEWER;UNITY_6000_0_OR_NEWER"
  foreach ($r in $refs) { $argList += "/reference:$r" }
}
$argList += $files

$raw = & $csc @argList 2>&1
if (Test-Path $outDll) { Remove-Item $outDll -Force -ErrorAction SilentlyContinue }

$semua = @($raw | Where-Object { $_ -match ": error CS" })

if ($unity) {
  # Mode API nyata: hanya error yang memang bukan urusan kita yang diabaikan.
  #  CS0518/CS1703/CS0006 = bentrok assembly dasar antara profil .NET Framework & Unity
  #  CS0246 pada tipe di modul Unity yang tidak ikut direferensikan
  $noise = 'CS1703|CS0518|CS0006|CS1701|CS1702|CS0656'
  $nyata = @($semua | Where-Object { $_ -notmatch $noise })
  Write-Host ("total error            : {0}" -f $semua.Count)
  Write-Host ("noise (profil .NET)    : {0}" -f ($semua.Count - $nyata.Count))
  Write-Host ("error API/SINTAKS      : {0}" -f $nyata.Count)
  Write-Host ""
  if ($nyata.Count -gt 0) {
    Write-Host "Error yang harus diperbaiki:" -ForegroundColor Red
    $nyata | Select-Object -First 60 | ForEach-Object { Write-Host "  $_" }
    exit 1
  }
  Write-Host "Kompilasi C# terhadap assembly Unity ASLI: bersih." -ForegroundColor Green
  Write-Host "Catatan: Unity tetap memakai compiler & asmdef sendiri, jadi build Unity" -ForegroundColor Yellow
  Write-Host "adalah pembuktian akhirnya." -ForegroundColor Yellow
  exit 0
}

$abaikan = 'CS0246|CS0234|CS0103|CS0518|CS0430|CS1069|CS0400|CS0012|CS0117|CS1061|CS0029|CS0019|CS1503|CS1729|CS7069|CS0616|CS0592|CS0122|CS0535|CS0534|CS0115|CS0311|CS0538'
$sintaks = @($semua | Where-Object { $_ -notmatch $abaikan })
Write-Host ("total error       : {0}" -f $semua.Count)
Write-Host ("error SINTAKS     : {0}" -f $sintaks.Count)
Write-Host ""
if ($sintaks.Count -gt 0) {
  Write-Host "Error sintaks:" -ForegroundColor Red
  $sintaks | Select-Object -First 40 | ForEach-Object { Write-Host "  $_" }
  exit 1
}
Write-Host "Sintaks C# OK (tanpa Unity, API belum diverifikasi)." -ForegroundColor Green
exit 0
