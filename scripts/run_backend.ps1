<#
Start backend (uvicorn) using the repository venv with sensible env var detection.
Creates logs/backend.log and run_backend.pid in the repo root.

Usage:
  pwsh -NoProfile -File .\scripts\run_backend.ps1

#>
param(
    [int]$Port = 8000
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir '..') | Select-Object -ExpandProperty Path
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
    Write-Error "Python venv not found at $venvPython. Activate or create the venv first (python -m venv .venv)."
    exit 1
}

# Detect model path
$defaultModel = Join-Path $repoRoot 'models\ggml-small.bin'
if (-not $env:LOCAL_WHISPER_CPP_MODEL_PATH -and (Test-Path $defaultModel)) {
    $env:LOCAL_WHISPER_CPP_MODEL_PATH = (Resolve-Path $defaultModel).Path
    Write-Host "Set LOCAL_WHISPER_CPP_MODEL_PATH=$env:LOCAL_WHISPER_CPP_MODEL_PATH"
} else {
    Write-Host "LOCAL_WHISPER_CPP_MODEL_PATH=$env:LOCAL_WHISPER_CPP_MODEL_PATH"
}

# Auto-detect whisper.cpp binary if not set
if (-not $env:LOCAL_WHISPER_CPP_BIN) {
    $candidates = @(
        "$repoRoot\externals\whisper.cpp\main.exe",
        "$repoRoot\externals\whisper.cpp\build\Release\main.exe",
        "$repoRoot\externals\whisper.cpp\build\main.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) {
            $env:LOCAL_WHISPER_CPP_BIN = (Resolve-Path $c).Path
            Write-Host "Auto-detected whisper.cpp binary at $env:LOCAL_WHISPER_CPP_BIN"
            break
        }
    }
}

Write-Host "Using Python: $venvPython"

# Kill any process listening on the port (only if we can find owning PIDs). Be careful.
try {
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listeners) {
        $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            Write-Host "Stopping existing process $pid listening on port $Port"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host "Could not query existing listeners: $_"
}

# Prepare logs and PID file

# Prepare logs and PID file. If we cannot create logs/ due to permissions, fall back to repo root
$logDir = Join-Path $repoRoot 'logs'
$logFile = $null
$errFile = $null
try {
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -ErrorAction Stop | Out-Null }
    $logFile = Join-Path $logDir 'backend.out.log'
    $errFile = Join-Path $logDir 'backend.err.log'
} catch {
    Write-Host "Warning: could not create logs directory ($_), falling back to repo root for logs"
    $logFile = Join-Path $repoRoot 'backend.out.log'
    $errFile = Join-Path $repoRoot 'backend.err.log'
}

$pidFile = Join-Path $repoRoot 'run_backend.pid'

if (Test-Path $pidFile) { Remove-Item $pidFile -ErrorAction SilentlyContinue }

Write-Host "Starting uvicorn (port $Port). Logs -> $logFile (stdout) and $errFile (stderr)"
$args = @('-m','uvicorn','main:app','--host','127.0.0.1','--port',$Port)
$working = Join-Path $repoRoot 'backend'
$proc = Start-Process -FilePath $venvPython -ArgumentList $args -WorkingDirectory $working -RedirectStandardOutput $logFile -RedirectStandardError $errFile -WindowStyle Hidden -PassThru

if ($proc) {
    try {
        $proc.Id | Out-File -FilePath $pidFile -Encoding ascii -Force
        $actualPidFile = $pidFile
    } catch {
        $fallback = Join-Path $env:TEMP "lucidspeak_run_backend_$($proc.Id).pid"
        try {
            $proc.Id | Out-File -FilePath $fallback -Encoding ascii -Force
            $actualPidFile = $fallback
            Write-Host "Warning: could not write PID to $pidFile; wrote to $fallback instead."
        } catch {
            $actualPidFile = $null
            Write-Host "Warning: could not write PID file to either $($pidFile) or $($fallback): $($_)"
        }
    }
    if ($actualPidFile) {
        Write-Host "Backend started with PID $($proc.Id). PID file: $actualPidFile"
    } else {
        Write-Host "Backend started with PID $($proc.Id). PID file not created."
    }
    Write-Host "To stop: .\scripts\stop_backend.ps1 or Stop-Process -Id $($proc.Id)"
} else {
    Write-Error "Failed to start backend process. Check $logFile for details."
}

Write-Host "Tail logs with: Get-Content -Path '$logFile' -Wait -Tail 200"
