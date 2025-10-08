import requests
from pathlib import Path
import os
import subprocess

import requests
from pathlib import Path

import os

# Allow overriding target base URL via TEST_BASE_URL environment variable
BASE = os.environ.get('TEST_BASE_URL', 'http://127.0.0.1:8000')
SAMPLES = [Path('tmp_test_wavs/short_30s.wav'), Path('tmp_test_wavs/long_90s.wav')]

def check_whisper_cpp():
    bin_path = os.environ.get('LOCAL_WHISPER_CPP_BIN')
    model_path = os.environ.get('LOCAL_WHISPER_CPP_MODEL_PATH')
    if not bin_path:
        print('LOCAL_WHISPER_CPP_BIN not set; skipping whisper.cpp check')
        return
    print('LOCAL_WHISPER_CPP_BIN=', bin_path)
    if not Path(bin_path).exists():
        print('whisper.cpp binary not found at', bin_path)
        return
    try:
        out = subprocess.check_output([bin_path, '--help'], stderr=subprocess.STDOUT, text=True)
        print('whisper.cpp --help output (truncated):')
        print('\n'.join(out.splitlines()[:20]))
    except Exception as e:
        print('Failed to run whisper.cpp binary:', e)

def post_file(p: Path):
    if not p.exists():
        print('Missing', p)
        return
    with open(p,'rb') as fh:
        r = requests.post(BASE + '/upload-audio/', files={'file': (p.name, fh, 'audio/wav')}, timeout=600)
        print(p.name, '->', r.status_code)
        try:
            print(r.json())
        except Exception as e:
            print('Response text:', r.text[:1000])

if __name__ == '__main__':
    print('Testing local transcribe endpoint at', BASE)
    check_whisper_cpp()
    for s in SAMPLES:
        post_file(s)

