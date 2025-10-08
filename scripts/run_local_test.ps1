<# Run the local test script and print backend tail logs for context #>
param(
    [int]$WaitForStartSec = 2
)

Write-Host "Waiting $WaitForStartSec seconds for backend to start..."
Start-Sleep -Seconds $WaitForStartSec

Write-Host "Running test script: python .\scripts\test_local_transcribe.py"
python .\scripts\test_local_transcribe.py

Write-Host "If you need to follow logs: Get-Content logs\backend.log -Wait -Tail 200"
