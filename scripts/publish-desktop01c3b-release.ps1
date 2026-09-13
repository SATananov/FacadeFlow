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
$expected = '0.1.2'
if ($version -ne $expected) { Fail "Expected source version $expected, found $version." }

$status = @(git status --short)
if ($status.Count -ne 0) {
  $status | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
  Fail 'Working tree must be clean before publishing a release.'
}

$head = (git rev-parse HEAD).Trim()
git fetch origin master --quiet
$origin = (git rev-parse origin/master).Trim()
if ($head -ne $origin) { Fail 'HEAD is not identical to origin/master. Commit and push 0.1.2 first.' }

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Fail 'GitHub CLI (gh) is not installed or not in PATH. Install/authenticate gh, then rerun this script.'
}

gh auth status
if ($LASTEXITCODE -ne 0) { Fail 'GitHub CLI is not authenticated.' }

$tag = "v$version"

# Windows PowerShell 5.1 turns stderr from `gh release view <missing-tag>` into
# NativeCommandError when ErrorActionPreference is Stop. Query the release list
# instead: a missing tag is a normal empty match, while command failures remain
# distinguishable by LASTEXITCODE.
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
if ($existingTags -contains $tag) { Fail "Release $tag already exists. Refusing to overwrite it." }

Write-Host '=== BUILD UPDATE PACKAGE ===' -ForegroundColor Cyan
npm run desktop:update
if ($LASTEXITCODE -ne 0) { Fail 'desktop:update build failed.' }

$exe = Join-Path $repo "release\FacadeFlow-Update-$version.exe"
$blockmap = "$exe.blockmap"
if (-not (Test-Path $exe)) { Fail "Update EXE missing: $exe" }
if (-not (Test-Path $blockmap)) { Fail "Update blockmap missing: $blockmap" }

$unpacked = Join-Path $repo 'release\win-unpacked\FacadeFlow.exe'
if (-not (Test-Path $unpacked)) { Fail 'Packaged FacadeFlow.exe missing.' }

Write-Host '=== PACKAGED 0.1.2 SMOKE ===' -ForegroundColor Cyan
& $unpacked --smoke-test
if ($LASTEXITCODE -ne 0) { Fail 'Packaged app smoke failed.' }

$notes = @"
FacadeFlow $version test update.

- Manual check-for-updates path: enabled
- In-app download engine: enabled
- Automatic install/restart: not enabled yet
- Intended test: installed 0.1.1 detects and downloads this update
"@

Write-Host '=== CREATE GITHUB RELEASE ===' -ForegroundColor Cyan
gh release create $tag $exe $blockmap --repo SATananov/FacadeFlow --title "FacadeFlow $version" --notes $notes
if ($LASTEXITCODE -ne 0) { Fail 'GitHub release creation failed.' }

Write-Host '=== VERIFY RELEASE ASSET ===' -ForegroundColor Cyan
$assetNames = @(gh release view $tag --repo SATananov/FacadeFlow --json assets --jq '.assets[].name')
if ($LASTEXITCODE -ne 0) { Fail 'Could not verify release assets.' }
$expectedAsset = "FacadeFlow-Update-$version.exe"
if (-not ($assetNames -contains $expectedAsset)) {
  Write-Host $assetNames
  Fail "Expected release asset $expectedAsset was not found."
}

Write-Host ''
Write-Host '=== DESKTOP 01C.3B RELEASE PUBLISHED ===' -ForegroundColor Green
Write-Host "TAG: $tag"
Write-Host "ASSET: $expectedAsset"
Write-Host 'SOURCE: origin/master matches HEAD'
Write-Host 'INSTALLED LOCAL APP: NOT UPDATED'
Write-Host 'NEXT: open installed FacadeFlow 0.1.1 and press Check for updates.'
