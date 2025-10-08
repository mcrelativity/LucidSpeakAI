## PowerShell script to install dependencies for local transcription
Write-Host "Installing local transcription dependencies..."
python -m pip install --upgrade pip setuptools wheel
python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision torchaudio
python -m pip install -r ..\requirements-local.txt
Write-Host "Done. Consider downloading a ggml model for whisper.cpp if you plan to use it." 
