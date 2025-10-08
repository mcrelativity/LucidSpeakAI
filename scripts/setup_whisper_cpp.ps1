# Setup whisper.cpp on Windows (clone, build, download small ggml model)
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\setup_whisper_cpp.ps1

param(
    [string]$RepoUrl = 'https://github.com/ggerganov/whisper.cpp',
    [string]$CloneDir = "$PSScriptRoot/../externals/whisper.cpp",
    [string]$ModelDir = "$PSScriptRoot/../models",
    [string]$ModelUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    [string]$ModelFile = 'ggml-small.bin'
)

Write-Host "Clone dir: $CloneDir"
Write-Host "Model dir: $ModelDir"

# Create directories
if (-Not (Test-Path $CloneDir)) {
    git clone $RepoUrl $CloneDir
} else {
    Write-Host "Repository already cloned at $CloneDir"
}

if (-Not (Test-Path $ModelDir)) {
    New-Item -ItemType Directory -Path $ModelDir | Out-Null
}

# Build whisper.cpp using CMake (requires Visual Studio / Build Tools)
Push-Location $CloneDir
try {
    if (-Not (Test-Path "build")) {
        mkdir build
    }
    Push-Location build
    Write-Host "Configuring CMake..."
    cmake .. -G "Visual Studio 17 2022" -A x64
    Write-Host "Building... (this may take several minutes)"
    cmake --build . --config Release
    Pop-Location
} catch {
    Write-Warning "CMake/Build step failed: $_"
    Write-Host "If you don't have Visual Studio build tools installed, you can still use the Python-based local transcribers (faster_whisper or whisper) listed in the docs."
}
Pop-Location

# Download the model if missing
$dest = Join-Path $ModelDir $ModelFile
if (-Not (Test-Path $dest)) {
    Write-Host "Downloading model to $dest..."
    try {
        Invoke-WebRequest -Uri $ModelUrl -OutFile $dest -UseBasicParsing
        Write-Host "Model downloaded."
    } catch {
        Write-Warning "Model download failed: $_"
    }
} else {
    Write-Host "Model already exists at $dest"
}

Write-Host "Setup complete. If build succeeded, set LOCAL_WHISPER_CPP_BIN to the built executable path and LOCAL_WHISPER_CPP_MODEL_PATH to the model file."
Write-Host "Example:
setx LOCAL_WHISPER_CPP_BIN \"$CloneDir\\main.exe\"
setx LOCAL_WHISPER_CPP_MODEL_PATH \"$dest\""