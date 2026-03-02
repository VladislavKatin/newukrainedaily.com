param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot ".local"
$pidFile = Join-Path $runtimeDir "next-dev.pid"
$logFile = Join-Path $runtimeDir "next-dev.log"
$url = "http://localhost:$Port"

function Test-SiteReady {
  param(
    [string]$TargetUrl
  )

  try {
    $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

function Open-Site {
  param(
    [string]$TargetUrl
  )

  Start-Process $TargetUrl | Out-Null
}

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

if (-not (Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

if ((Test-SiteReady -TargetUrl $url) -and (Get-PortPids -TargetPort $Port).Count -gt 0) {
  Write-Host "Site is already running at $url"
  Open-Site -TargetUrl $url
  exit 0
}

$serverCommand = "cd /d $repoRoot && npm.cmd run dev > `"$logFile`" 2>&1"
$serverProcess = Start-Process cmd.exe `
  -ArgumentList "/c", $serverCommand `
  -PassThru

Set-Content -Path $pidFile -Value $serverProcess.Id

for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1

  if ((Test-SiteReady -TargetUrl $url) -and (Get-PortPids -TargetPort $Port).Count -gt 0) {
    Write-Host "Site is running at $url"
    Open-Site -TargetUrl $url
    exit 0
  }
}

if (Test-Path $logFile) {
  Write-Host "Last server log lines:"
  Get-Content $logFile -Tail 20
}

Write-Error "Local site did not become ready at $url within 60 seconds."
