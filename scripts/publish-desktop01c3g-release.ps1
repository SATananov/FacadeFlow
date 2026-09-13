$ErrorActionPreference = 'Stop'

function Fail([string]$message) {
  Write-Host ''
  Write-Host ('RELEASE FAILED: ' + $message) -ForegroundColor Red
  throw $message
}

$repo = (Get-Location).Path
if (-not (Test-Path (Join-Path $repo '.git'))) { Fail 'Run this inside C:\Users\stana\Desktop\FacadeFlow.' }

$pkg = Get-Content (Join-Path $repo 'package.json') -Raw | ConvertFrom-Json
$version = [string]$pkg.version
$expected = '0.1.6'
if ($version -ne $expected) { Fail "Expected source version $expected, found $version." }

$status = @(git status --short)
if ($status.Count -ne 0) {
  $status | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
  Fail 'Working tree must be clean before publishing a release.'
}

$head = (git rev-parse HEAD).Trim()
git fetch origin master --quiet
if ($LASTEXITCODE -ne 0) { Fail 'git fetch origin master failed.' }
$origin = (git rev-parse origin/master).Trim()
if ($head -ne $origin) { Fail 'HEAD is not identical to origin/master. Commit and push 0.1.6 first.' }

$installedExe = Join-Path $env:LOCALAPPDATA 'Programs\FacadeFlow\FacadeFlow.exe'
if (-not (Test-Path -LiteralPath $installedExe)) { Fail "Installed FacadeFlow seed not found: $installedExe" }
$installedVersion = [string](Get-Item -LiteralPath $installedExe).VersionInfo.FileVersion
if (-not $installedVersion.StartsWith('0.1.5')) { Fail "Installed FacadeFlow seed must be 0.1.5 for the real update test; found $installedVersion." }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Fail 'GitHub CLI (gh) is not installed or not in PATH.' }
gh auth status
if ($LASTEXITCODE -ne 0) { Fail 'GitHub CLI is not authenticated.' }

$tag = "v$version"
$previousTag = 'v0.1.5'
$previousErrorActionPreference = $ErrorActionPreference
try {
  $ErrorActionPreference = 'Continue'
  $existingTags = @(gh release list --repo SATananov/FacadeFlow --limit 100 --json tagName --jq '.[].tagName')
  $releaseListExit = $LASTEXITCODE
}
finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
if ($releaseListExit -ne 0) { Fail 'Could not query existing GitHub releases.' }
if (-not ($existingTags -contains $previousTag)) { Fail "Expected previous release $previousTag was not found." }
if ($existingTags -contains $tag) { Fail "Release $tag already exists. Refusing to overwrite it." }

Write-Host '=== VERIFY SOURCE 0.1.6 ===' -ForegroundColor Cyan
npm run test:desktop-handoff-survival
if ($LASTEXITCODE -ne 0) { Fail 'Windows handoff survival test failed.' }
npm run test:desktop01c3g
if ($LASTEXITCODE -ne 0) { Fail 'DESKTOP 01C.3G verifier failed.' }

Write-Host '=== BUILD UPDATE PACKAGE 0.1.6 ===' -ForegroundColor Cyan
npm run desktop:update
if ($LASTEXITCODE -ne 0) { Fail 'desktop:update build failed.' }

$exe = Join-Path $repo "release\FacadeFlow-Update-$version.exe"
$blockmap = "$exe.blockmap"
if (-not (Test-Path -LiteralPath $exe)) { Fail "Update EXE missing: $exe" }
if (-not (Test-Path -LiteralPath $blockmap)) { Fail "Update blockmap missing: $blockmap" }

$unpacked = Join-Path $repo 'release\win-unpacked\FacadeFlow.exe'
if (-not (Test-Path -LiteralPath $unpacked)) { Fail 'Packaged FacadeFlow.exe missing.' }
Write-Host '=== PACKAGED 0.1.6 SMOKE ===' -ForegroundColor Cyan
& $unpacked --smoke-test
if ($LASTEXITCODE -ne 0) { Fail 'Packaged app smoke failed.' }

$notes = @"
FacadeFlow $version product-navigation and Home workspace update.
- Installed test seed: 0.1.5
- New primary product navigation and polished Home workspace
- Clear active-project / free-project / no-project states
- Revised project toolbar and Revision / Checks language
- Manual check for updates: enabled
- In-app download: enabled
- Install + restart: human initiated only
- Windows updater handoff: WMI/CIM independent worker
- Worker repeats canonical filename, size, SHA-256 and MZ checks before NSIS /S
- Expected flow: 0.1.5 detects 0.1.6, downloads it, user confirms update, FacadeFlow closes, NSIS updates, FacadeFlow relaunches as 0.1.6
- User-data preservation boundary remains unchanged
"@

Write-Host '=== CREATE GITHUB RELEASE v0.1.6 ===' -ForegroundColor Cyan
gh release create $tag $exe $blockmap --repo SATananov/FacadeFlow --title "FacadeFlow $version" --notes $notes
if ($LASTEXITCODE -ne 0) { Fail 'GitHub release creation failed.' }

Write-Host '=== VERIFY RELEASE ASSETS ===' -ForegroundColor Cyan
$assetNames = @(gh release view $tag --repo SATananov/FacadeFlow --json assets --jq '.assets[].name')
if ($LASTEXITCODE -ne 0) { Fail 'Could not verify release assets.' }
$expectedAsset = "FacadeFlow-Update-$version.exe"
$expectedBlockmap = "$expectedAsset.blockmap"
if (-not ($assetNames -contains $expectedAsset)) { Fail "Expected release asset $expectedAsset was not found." }
if (-not ($assetNames -contains $expectedBlockmap)) { Fail "Expected release asset $expectedBlockmap was not found." }

Write-Host ''
Write-Host '=== DESKTOP 01C.3G RELEASE PUBLISHED ===' -ForegroundColor Green
Write-Host "TAG: $tag"
Write-Host "ASSET: $expectedAsset"
Write-Host "BLOCKMAP: $expectedBlockmap"
Write-Host 'SOURCE: origin/master matches HEAD'
Write-Host "INSTALLED LOCAL APP: $installedVersion (KEEP 0.1.5 FOR TEST)"
Write-Host 'NEXT: open installed FacadeFlow 0.1.5 -> Check -> Download -> Update and restart.'
