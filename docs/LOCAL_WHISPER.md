Local transcription setup (whisper.cpp & faster_whisper)

This guide explains how to set up a local transcription pipeline for LucidSpeak without cloud costs. Two approaches are covered:

- faster_whisper (Python; recommended for CPU-only machines with optimized inference)
- whisper.cpp (native binary using ggml models; minimal deps)

Choose one or both. The backend will try whisper.cpp -> faster_whisper -> openai/whisper -> cloud fallback.

A. Install Python dependencies (faster_whisper path)

1. Activate your virtualenv for the project.

2. Install PyTorch CPU wheels (recommended):

```pwsh
# On Windows, install CPU-only PyTorch from official index
pip install --upgrade pip setuptools wheel
pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision torchaudio
```

3. Install faster-whisper and other deps:

```pwsh
pip install faster-whisper webrtcvad pydub soundfile numpy librosa
```

4. Optionally set the env var to choose model size (default: small):

```pwsh
setx LOCAL_WHISPER_MODEL "small"
```

B. Install whisper.cpp (native)

1. Download a prebuilt binary or build from source: https://github.com/ggerganov/whisper.cpp

2. Obtain a GGML model (e.g., `ggml-small.bin`) from: https://huggingface.co/ggerganov/whisper.cpp/tree/main/models or use weights from OpenAI converted to ggml.

3. Place the binary and model somewhere accessible and set these env vars:

```pwsh
# set path to whisper.cpp binary
setx LOCAL_WHISPER_CPP_BIN "C:\\path\\to\\main.exe"
# set path to ggml model
setx LOCAL_WHISPER_CPP_MODEL_PATH "C:\\path\\to\\models\\ggml-small.bin"
```

C. Test locally

1. Start the backend (so it can use the local transcriber):

```pwsh
# from z:\\lucidspeak\\backend
uvicorn main:app --reload
```

2. Run the included test script to transcribe the sample WAVs (or make your own recordings):

```pwsh
python scripts/test_local_transcribe.py
```

E. Automated setup scripts (Windows)

There are helper PowerShell scripts in `scripts/` to automate most steps for whisper.cpp on Windows:

- `scripts/setup_whisper_cpp.ps1` — clones the `whisper.cpp` repo, attempts to build it using CMake and Visual Studio tools, and downloads a ggml model (`ggml-small.bin`) into `models/`.
- `scripts/check_whisper_cpp.ps1` — validates that the whisper.cpp binary and model file exist and runs a help command to confirm.

Usage example (PowerShell):

```pwsh
# Run the setup (may require Visual Studio build tools installed)
powershell -ExecutionPolicy Bypass -File .\scripts\setup_whisper_cpp.ps1

# After setup, check the binary and model
powershell -ExecutionPolicy Bypass -File .\scripts\check_whisper_cpp.ps1

# Then set env vars and restart backend
setx LOCAL_WHISPER_CPP_BIN "C:\\path\\to\\whisper.cpp\\main.exe"
setx LOCAL_WHISPER_CPP_MODEL_PATH "C:\\path\\to\\whisper.cpp\\models\\ggml-small.bin"
```

D. Notes & tips
- Model size tradeoffs: `tiny`/`base` are fast but less accurate; `small`/`medium` balance speed and quality. `large` gives best quality but is slow on CPU.
- If you install `faster_whisper`, prefer `compute_type='int8'` for CPU speed — the backend uses that setting.
- If `whisper.cpp` is available, it's typically the fastest for CPU-only setups (prebuilt binary recommended).

F. Quick start with helper scripts

I included small helpers to make starting/stopping the backend and running the local test easy:

- `scripts/run_backend.ps1` — start the backend using `.venv` Python, auto-set model path if `models/ggml-small.bin` exists, write logs to `logs/backend.log`, and write PID to `run_backend.pid`.
- `scripts/stop_backend.ps1` — stop the backend started by the run script (reads PID file).
- `scripts/run_local_test.ps1` — runs `scripts/test_local_transcribe.py` and suggests how to tail logs.

Usage example:

```pwsh
# Start backend (in background); logs in logs\backend.log
powershell -NoProfile -File .\scripts\run_backend.ps1

# Wait a couple seconds, then run the test
powershell -NoProfile -File .\scripts\run_local_test.ps1

# When finished, stop the backend
powershell -NoProfile -File .\scripts\stop_backend.ps1
```
