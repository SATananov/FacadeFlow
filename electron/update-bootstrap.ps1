param(
  [Parameter(Mandatory=$true)][string]$RequestPath,
  [Parameter(Mandatory=$true)][string]$PowerShellPath
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$transactionDir = Split-Path -Parent $RequestPath
$logPath = Join-Path $transactionDir 'bootstrap.log'
function Write-Record([string]$name, $record) {
  $target = Join-Path $transactionDir $name
  $temporary = $target + '.tmp'
  $record | ConvertTo-Json -Compress | Set-Content -LiteralPath $temporary -Encoding UTF8
  Move-Item -LiteralPath $temporary -Destination $target -Force
}
try {
  $request = Get-Content -Raw -Encoding UTF8 -LiteralPath $RequestPath | ConvertFrom-Json
  Write-Record 'bootstrap-ready.json' @{ token=$request.token; bootstrapPid=$PID }
  $workerPath = Join-Path $transactionDir 'worker.ps1'
  $command = "& '" + $workerPath.Replace("'", "''") + "' -RequestPath '" + $RequestPath.Replace("'", "''") + "'"
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
  $commandLine = '"' + $PowerShellPath + '" -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ' + $encoded
  $startup = New-CimInstance -ClassName Win32_ProcessStartup -ClientOnly -Property @{
    ShowWindow=[uint16]0
  }
  # Local Windows provider creates the worker; Node does not own this process lifetime.
  $created = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine=$commandLine; CurrentDirectory=$transactionDir; ProcessStartupInformation=$startup
  }
  if ($created.ReturnValue -ne 0) { throw ("Windows worker creation failed: " + $created.ReturnValue) }
  $workerId = [int]$created.ProcessId
  $deadline = (Get-Date).AddSeconds(12)
  $readyPath = Join-Path $transactionDir 'worker-ready.json'
  while (-not (Test-Path -LiteralPath $readyPath)) {
    if (Test-Path -LiteralPath (Join-Path $transactionDir 'cancel.flag')) { throw 'Handoff cancelled.' }
    if (-not (Get-Process -Id $workerId -ErrorAction SilentlyContinue)) { throw 'Worker exited before READY.' }
    if ((Get-Date) -gt $deadline) { throw 'Worker READY timeout.' }
    Start-Sleep -Milliseconds 100
  }
  $ready = Get-Content -Raw -Encoding UTF8 -LiteralPath $readyPath | ConvertFrom-Json
  $worker = Get-Process -Id $workerId -ErrorAction Stop
  $parent = Get-Process -Id $request.parentPid -ErrorAction Stop
  if ($ready.token -cne $request.token -or $ready.workerPid -ne $workerId -or
    $ready.parentPid -ne $request.parentPid -or
    $ready.workerStartTicks -ne $worker.StartTime.ToUniversalTime().Ticks.ToString() -or
    $ready.sessionId -ne $parent.SessionId) { throw 'Worker READY identity/session mismatch.' }
  Write-Record 'bootstrap-ack.json' @{
    token=$request.token; workerPid=$workerId; sessionId=$worker.SessionId
  }
  'BOOTSTRAP PASS' | Set-Content -LiteralPath $logPath -Encoding UTF8
  exit 0
} catch {
  $_.Exception.Message | Set-Content -LiteralPath $logPath -Encoding UTF8
  if (Test-Path -LiteralPath $RequestPath) {
    'CANCEL' | Set-Content -LiteralPath (Join-Path $transactionDir 'cancel.flag') -Encoding ASCII
  }
  Write-Error $_
  exit 1
}
