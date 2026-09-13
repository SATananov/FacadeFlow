param([Parameter(Mandatory=$true)][string]$RequestPath)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$transactionDir = Split-Path -Parent $RequestPath
$logPath = Join-Path $transactionDir 'worker.log'
function Write-UpdateLog([string]$message) {
  Add-Content -LiteralPath $logPath -Value ((Get-Date).ToString('s') + ' ' + $message) -Encoding UTF8
}
function Write-Record([string]$name, $record) {
  $target = Join-Path $transactionDir $name
  $temporary = $target + '.tmp'
  $record | ConvertTo-Json -Compress | Set-Content -LiteralPath $temporary -Encoding UTF8
  Move-Item -LiteralPath $temporary -Destination $target -Force
}
function Assert-NotCancelled {
  if (Test-Path -LiteralPath (Join-Path $transactionDir 'cancel.flag')) { throw 'Handoff cancelled.' }
}
function Test-ParentAlive {
  $candidate = Get-Process -Id $request.parentPid -ErrorAction SilentlyContinue
  return $null -ne $candidate -and $candidate.StartTime.ToUniversalTime().Ticks.ToString() -eq $parentStartTicks
}
try {
  $request = Get-Content -Raw -Encoding UTF8 -LiteralPath $RequestPath | ConvertFrom-Json
  if ($request.mode -ne 'install' -and $request.mode -ne 'probe') { throw 'Invalid worker mode.' }
  $parent = Get-Process -Id $request.parentPid -ErrorAction Stop
  $parentStartTicks = $parent.StartTime.ToUniversalTime().Ticks.ToString()
  $worker = Get-Process -Id $PID
  Write-Record 'worker-ready.json' @{
    token=$request.token; parentPid=$request.parentPid; workerPid=$PID
    workerStartTicks=$worker.StartTime.ToUniversalTime().Ticks.ToString(); sessionId=$worker.SessionId
  }
  Write-UpdateLog ("READY; WAIT AUTHORIZE/PARENT " + $request.parentPid)
  $deadline = (Get-Date).AddSeconds(45)
  $authorizePath = Join-Path $transactionDir 'authorize.flag'
  while (-not (Test-Path -LiteralPath $authorizePath)) {
    Assert-NotCancelled
    if (-not (Test-ParentAlive)) { throw 'Parent exited without authorization.' }
    if ((Get-Date) -gt $deadline) { throw 'Authorization timeout.' }
    Start-Sleep -Milliseconds 100
  }
  Assert-NotCancelled
  if ((Get-Content -Raw -LiteralPath $authorizePath) -cne $request.token) { throw 'Authorization token mismatch.' }
  Write-Record 'worker-authorized.json' @{ token=$request.token; parentPid=$request.parentPid; workerPid=$PID }
  Write-UpdateLog 'AUTHORIZED'
  $deadline = (Get-Date).AddSeconds(30)
  while (Test-ParentAlive) {
    Assert-NotCancelled
    if ((Get-Date) -gt $deadline) { throw 'FacadeFlow did not close in time.' }
    Start-Sleep -Milliseconds 100
  }
  Assert-NotCancelled
  if ($request.mode -eq 'probe') {
    # Dedicated harmless test: this branch cannot execute any installer.
    Start-Sleep -Milliseconds 500
    Write-Record 'post-parent.json' @{ token=$request.token; workerPid=$PID; parentPid=$request.parentPid; parentGone=(-not (Test-ParentAlive)) }
    Write-UpdateLog 'PROBE PASS'
    exit 0
  }

  $InstallerPath = [string]$request.installerPath
  $RelaunchPath = [string]$request.relaunchPath
  $ExpectedVersion = [string]$request.expectedVersion
  if ($ExpectedVersion -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') { throw 'Invalid update version.' }
  if ([IO.Path]::GetFileName($InstallerPath) -cne ('FacadeFlow-Update-' + $ExpectedVersion + '.exe')) { throw 'Installer filename mismatch.' }
  $installerInfo = Get-Item -LiteralPath $InstallerPath
  if ($installerInfo.PSIsContainer -or $installerInfo.Length -le 0 -or $installerInfo.Length -ne $request.expectedBytes) { throw 'Installer size mismatch.' }
  if ((Get-FileHash -LiteralPath $InstallerPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $request.expectedSha256) { throw 'Installer SHA-256 mismatch.' }
  $stream = [IO.File]::OpenRead($InstallerPath)
  try { if ($stream.ReadByte() -ne 0x4d -or $stream.ReadByte() -ne 0x5a) { throw 'Installer MZ header mismatch.' } } finally { $stream.Dispose() }
  Write-UpdateLog ("INSTALL " + $InstallerPath)
  $installer = Start-Process -FilePath $InstallerPath -ArgumentList '/S' -WindowStyle Hidden -PassThru -Wait
  if ($installer.ExitCode -ne 0) { throw ("Installer exit code " + $installer.ExitCode) }
  # Existing executable presence alone can silently relaunch the old version.
  $deadline = (Get-Date).AddSeconds(45)
  $expectedNumericVersion = ($ExpectedVersion -split '[-+]')[0]
  do {
    $installed = Get-Item -LiteralPath $RelaunchPath -ErrorAction SilentlyContinue
    $versionMatches = $false
    if ($installed -and -not $installed.PSIsContainer) {
      $info = [Diagnostics.FileVersionInfo]::GetVersionInfo($RelaunchPath)
      $installedNumericVersion = '{0}.{1}.{2}' -f $info.ProductMajorPart,$info.ProductMinorPart,$info.ProductBuildPart
      $versionMatches = $installedNumericVersion -eq $expectedNumericVersion
    }
    if ($versionMatches) { break }
    if ((Get-Date) -gt $deadline) { throw 'Installed FacadeFlow version does not match expected update.' }
    Start-Sleep -Milliseconds 250
  } while ($true)
  Write-UpdateLog ("RELAUNCH VERIFIED " + $ExpectedVersion)
  $relaunched = Start-Process -FilePath $RelaunchPath -PassThru
  Start-Sleep -Milliseconds 1000
  if ($relaunched.HasExited) { throw 'Relaunched FacadeFlow exited immediately.' }
  Write-UpdateLog 'PASS'
  exit 0
} catch {
  Write-UpdateLog ("FAIL " + $_.Exception.Message)
  exit 1
}
