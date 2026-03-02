param(
  [int]$Port = 3000
)

$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".local"
$pidFile = Join-Path $runtimeDir "next-dev.pid"
$logFile = Join-Path $runtimeDir "next-dev.log"

function Get-PortPids {
  param(
    [int]$TargetPort
  )

  $matches = netstat -ano | Select-String -Pattern "LISTENING"
  $pids = @()

  foreach ($match in $matches) {
    $parts = ($match.Line -replace '\s+', ' ').Trim().Split(' ')
    if ($parts.Length -ge 5 -and $parts[1] -match ":$TargetPort$") {
      $portPid = $parts[-1]
      if ($portPid -match '^\d+$') {
        $pids += [int]$portPid
      }
    }
  }

  return $pids | Sort-Object -Unique
}

if (Test-Path $pidFile) {
  $pidValue = Get-Content $pidFile | Select-Object -First 1

  if ($pidValue -match '^\d+$') {
    taskkill /PID ([int]$pidValue) /T /F | Out-Null
  }

  Remove-Item $pidFile -Force
}

foreach ($portPid in (Get-PortPids -TargetPort $Port)) {
  taskkill /PID $portPid /T /F | Out-Null
}

if (Test-Path $logFile) {
  Remove-Item $logFile -Force
}

Write-Host "Stopped local site processes on port $Port."
