<# Stop the backend started by run_backend.ps1 #>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir '..') | Select-Object -ExpandProperty Path
$pidFile = Join-Path $repoRoot 'run_backend.pid'

if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile | Select-Object -First 1
    if ($pid) {
        Write-Host "Killing PID $pid"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Remove-Item $pidFile -ErrorAction SilentlyContinue
        Write-Host "Stopped backend"
        exit 0
    }
}
Write-Host "No PID file found. Use Get-Process python to find running uvicorn instances."
