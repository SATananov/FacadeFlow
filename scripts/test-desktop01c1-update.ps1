$ErrorActionPreference = 'Stop'

function Fail([string]$message) {
    Write-Host ''
    Write-Host ('FAILED: ' + $message) -ForegroundColor Red
    throw $message
}

function Get-TreeManifest([string]$root) {
    if (-not (Test-Path $root)) { return @() }
    $items = @()
    Get-ChildItem -Path $root -File -Recurse -Force -ErrorAction SilentlyContinue |
        Sort-Object FullName |
        ForEach-Object {
            $relative = $_.FullName.Substring($root.Length).TrimStart([char]92, [char]47)
            $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
            $items += ($relative + '|' + $_.Length + '|' + $hash)
        }
    return $items
}

$desktop = [Environment]::GetFolderPath('Desktop')
$update = Join-Path $desktop 'FacadeFlow-Update-0.1.1.exe'
$installedExe = Join-Path $env:LOCALAPPDATA 'Programs\FacadeFlow\FacadeFlow.exe'
$userData = Join-Path $env:APPDATA 'FacadeFlow'
$localStorage = Join-Path $userData 'Local Storage'
$shortcut = Join-Path $desktop 'FacadeFlow.lnk'
$sentinel = Join-Path $userData '.facadeflow-update-preservation-01c1.txt'
$sentinelValue = [guid]::NewGuid().ToString('N')

Write-Host '=== FACADEFLOW 0.1.1 UPDATE PRESERVATION TEST ===' -ForegroundColor Cyan

if (-not (Test-Path $update)) { Fail "Update file was not found: $update" }
if (-not (Test-Path $installedExe)) { Fail "Installed FacadeFlow was not found: $installedExe" }

$running = @(Get-Process -Name 'FacadeFlow' -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
    Fail 'FacadeFlow is running. Close it before applying the update.'
}

$beforeVersion = (Get-Item $installedExe).VersionInfo.ProductVersion
Write-Host ('Installed version before update: ' + $beforeVersion)

New-Item -ItemType Directory -Path $userData -Force | Out-Null
Set-Content -Path $sentinel -Value $sentinelValue -Encoding ASCII

$beforeManifest = @(Get-TreeManifest $localStorage)
Write-Host ('Local Storage files before update: ' + $beforeManifest.Count)
$storageBackup = $null
if ($beforeManifest.Count -eq 0) {
    Write-Host 'NOTE: no Local Storage files were present; sentinel preservation will still be tested.' -ForegroundColor Yellow
}
else {
    $storageBackup = Join-Path $env:TEMP ('FacadeFlow_LocalStorage_PRE_UPDATE_0_1_1_' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
    Copy-Item $localStorage $storageBackup -Recurse -Force
    Write-Host ('Safety backup: ' + $storageBackup) -ForegroundColor DarkGray
}

Write-Host ''
Write-Host '=== APPLY UPDATE SILENTLY ===' -ForegroundColor Cyan
$process = Start-Process -FilePath $update -ArgumentList '/S' -Wait -PassThru
if ($process.ExitCode -ne 0) { Fail ('Update installer exit code: ' + $process.ExitCode) }

if (-not (Test-Path $installedExe)) { Fail 'Installed FacadeFlow.exe disappeared after update.' }
if (-not (Test-Path $sentinel)) { Fail 'User-data sentinel was deleted by the update.' }
if ((Get-Content $sentinel -Raw).Trim() -ne $sentinelValue) { Fail 'User-data sentinel changed during update.' }

$afterManifest = @(Get-TreeManifest $localStorage)
if (($beforeManifest -join "`n") -ne ($afterManifest -join "`n")) {
    Write-Host ('PRE-UPDATE BACKUP RETAINED: ' + $storageBackup) -ForegroundColor Yellow
    Fail 'Local Storage changed during installer update. The pre-update safety backup was retained.'
}

$afterVersion = (Get-Item $installedExe).VersionInfo.ProductVersion
Write-Host ('Installed version after update:  ' + $afterVersion)
if ($afterVersion -notmatch '^0\.1\.1(?:\.|$)') {
    Fail ('Expected installed version 0.1.1, got: ' + $afterVersion)
}

Write-Host ''
Write-Host '=== INSTALLED APP SMOKE ===' -ForegroundColor Cyan
$smoke = Start-Process -FilePath $installedExe -ArgumentList '--smoke-test' -Wait -PassThru
if ($smoke.ExitCode -ne 0) { Fail ('Installed app smoke failed with exit code: ' + $smoke.ExitCode) }

if (-not (Test-Path $shortcut)) { Fail 'Desktop FacadeFlow shortcut is missing after update.' }

Remove-Item $sentinel -Force -ErrorAction SilentlyContinue
if ($storageBackup -and (Test-Path $storageBackup)) { Remove-Item $storageBackup -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host ''
Write-Host '=== DESKTOP 01C.1 UPDATE TEST PASS ===' -ForegroundColor Green
Write-Host 'OLD INSTALLATION: DETECTED'
Write-Host 'UPDATE TO 0.1.1: PASS'
Write-Host 'USER DATA SENTINEL: PRESERVED'
Write-Host 'LOCAL STORAGE BYTE MANIFEST: PRESERVED'
Write-Host 'DESKTOP SHORTCUT: PRESERVED'
Write-Host 'INSTALLED APP SMOKE: PASS'
Write-Host 'PROJECT DATA STORAGE LOCATION: PRESERVED'
Write-Host ''
Write-Host 'Starting updated FacadeFlow...' -ForegroundColor Cyan
Start-Process -FilePath $installedExe
