# Simple checks for whisper.cpp binary and model
param(
    [string]$Bin = $env:LOCAL_WHISPER_CPP_BIN,
    [string]$Model = $env:LOCAL_WHISPER_CPP_MODEL_PATH
)

if (-not $Bin) {
    Write-Error "Environment variable LOCAL_WHISPER_CPP_BIN not set."
} elseif (-not (Test-Path $Bin)) {
    Write-Error "Binary not found at $Bin"
} else {
    Write-Host "Found binary: $Bin"
}

if (-not $Model) {
    Write-Error "Environment variable LOCAL_WHISPER_CPP_MODEL_PATH not set."
} elseif (-not (Test-Path $Model)) {
    Write-Error "Model file not found at $Model"
} else {
    Write-Host "Found model: $Model"
}

if ((Test-Path $Bin) -and (Test-Path $Model)) {
    Write-Host "Running binary --help to verify..."
    & $Bin --help
}
