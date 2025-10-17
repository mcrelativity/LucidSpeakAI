# Pro Audio Analysis Architecture

## Current System Analysis

### Existing Components (Free Tier)
- **Transcription**: Google Cloud Speech API (supports es-ES, en-US)
- **Acoustic Analysis**: 
  - Duration tracking
  - Basic pitch variation (using librosa piptrack)
  - Filler word detection (100+ Spanish/English fillers)
  - Conviction scoring (pace, disfluencies, hedging)
- **Storage**: Supabase (PostgreSQL backend)
- **Auth**: JWT tokens with 7-day expiration
- **Rate Limiting**: 30 uploads/minute per user

### Current Limitations (Why We Need Pro Features)
1. **Whisper Normalization**: Transcription removes vocal characteristics
   - Elongations lost ("sooo" → "so")
   - Vocal fry, strain not captured
   - Pauses/hesitations approximated only by silence detection
2. **Limited Audio Metrics**: Only pitch_variation captured
   - No prosody analysis (pitch range, inflection)
   - No energy/intensity tracking
   - No speaking rate precision
   - No emotion detection
3. **Filler Detection**: Text-only, relies on word matching
   - Misses acoustic patterns
   - Can't distinguish nervous vs intentional fillers
   - No confidence scoring on detections
4. **No AI-Powered Insights**: Uses hardcoded rules and templates
   - Can't understand complex speech patterns
   - Limited contextual understanding
   - No personalized recommendations

---

## Pro Audio Analysis Architecture (New)

### Data Flow for Pro Users

```
┌─────────────────┐
│  Audio Upload   │
└────────┬────────┘
         │
    ┌────v────┐
    │ Validate │ (Tier Check: Pro?)
    └────┬────┘
         │
    ┌────v──────────────────────────────────┐
    │ Parallel Processing                   │
    ├──────────────────────────────────────┤
    │ 1. Whisper Transcription              │
    │ 2. Audio Feature Extraction           │
    │ 3. Prosody Analysis                   │
    │ 4. Emotion Detection (Optional)       │
    └────┬──────────────────────────────────┘
         │
    ┌────v──────────────────────────────────┐
    │ Correlation & Analysis                │
    ├──────────────────────────────────────┤
    │ - Align timestamps                    │
    │ - Detect fillers from audio           │
    │ - Analyze prosody patterns            │
    │ - Score confidence levels             │
    └────┬──────────────────────────────────┘
         │
    ┌────v──────────────────────────────────┐
    │ GPT-4 Contextual Analysis             │
    ├──────────────────────────────────────┤
    │ - Synthesize all metrics              │
    │ - Generate insights                   │
    │ - Provide recommendations             │
    │ - Emotional tone analysis             │
    └────┬──────────────────────────────────┘
         │
    ┌────v──────────────────┐
    │ Store Results         │
    │ Return to Client      │
    └──────────────────────┘
```

### Audio Analysis Components

#### 1. **Audio Feature Extraction** (librosa)
```
Extract from raw audio:
├─ Duration
├─ RMS Energy (loudness)
├─ Spectral Centroid (brightness/harshness)
├─ Zero Crossing Rate (noise/friction)
├─ MFCC (13 coefficients - speech characteristics)
├─ Onset Detection (word/syllable boundaries)
└─ Silence Detection (pauses, hesitations)
```

#### 2. **Prosody Analysis** (parselmouth/Praat)
```
Analyze pitch and intensity:
├─ Pitch Tracking
│  ├─ Mean pitch (Hz)
│  ├─ Pitch range (min-max)
│  ├─ Pitch std deviation (variation)
│  └─ Pitch contour (rising/falling patterns)
├─ Intensity Analysis
│  ├─ Mean intensity (dB)
│  ├─ Intensity range
│  └─ Intensity variation
└─ Speech Rate
   ├─ Words per minute
   ├─ Syllables per second
   └─ Pausing patterns
```

#### 3. **Filler Detection** (Audio-based + Text)
```
Dual approach:
├─ Text-based (existing)
│  └─ Word matching with confidence
├─ Audio-based (NEW)
│  ├─ Detect acoustic signatures
│  │  ├─ "um" - 500Hz resonance peak
│  │  ├─ "uh" - lower frequency resonance
│  │  ├─ "er" - 600-800Hz range
│  │  └─ "ah" - open vowel, varies by pitch
│  ├─ Measure filler duration
│  ├─ Detect vocal quality
│  │  ├─ Vocal fry (creaky voice)
│  │  ├─ Falsetto (strained high)
│  │  └─ Breathiness (aspirated)
│  └─ Align with transcript timestamps
└─ Confidence Scoring
   └─ Combine text+audio signals for accuracy
```

#### 4. **Emotion Detection** (Optional for Pro+)
```
Use transformer models:
├─ Speech Emotion Recognition (pyannote-audio)
│  ├─ Happy/Confident
│  ├─ Sad/Discouraged
│  ├─ Angry/Frustrated
│  ├─ Neutral/Formal
│  └─ Anxious/Uncertain
└─ Correlate with metrics
   ├─ High pitch + fast speech = excitement/nervousness
   ├─ Low pitch + slow speech = confidence/sadness
   └─ Varied pitch = engagement
```

### Integration Points with Existing Code

#### Current Flow:
```python
upload_audio() 
  → analyze_acoustics() [pitch variation only]
  → Google Speech API [transcription]
  → analyze_conviction() [filler detection, pace]
  → /insights endpoint [hardcoded rules]
```

#### New Pro Flow (Conditional):
```python
upload_audio()
  → Check user tier
  │
  ├─ If FREE/BASIC:
  │  └─ Use existing flow (analyze_acoustics + Google Speech)
  │
  └─ If PRO/PRO_PLUS:
     └─ Use ProAudioAnalyzer
        ├─ Audio Feature Extraction [librosa]
        ├─ Whisper Transcription [OpenAI]
        ├─ Prosody Analysis [parselmouth]
        ├─ Filler Detection [audio + text]
        ├─ Emotion Detection [pyannote-audio] (optional)
        └─ GPT Synthesis [OpenAI API]
```

---

## Database Schema Changes

### Existing User Table (extend):
```sql
-- Already have:
- id, email, hashed_password
- tier (free, basic, pro, pro_plus)
- minutes_used
- created_at, updated_at

-- Add for Pro:
- openai_analysis_count (track API usage for cost)
- last_pro_analysis (timestamp)
- pro_features_enabled (bool)
```

### New `pro_analyses` Table:
```sql
CREATE TABLE pro_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recording_id UUID REFERENCES recordings(id),
  
  -- Raw metrics
  audio_features JSONB,
  prosody_analysis JSONB,
  
  -- Filler detection
  fillers JSONB,  -- {word: count, confidence: score, timestamp: []}
  filler_density FLOAT,
  
  -- Emotions (if enabled)
  emotion_analysis JSONB,
  
  -- GPT Analysis
  gpt_insights TEXT,
  recommendations TEXT[],
  overall_score FLOAT,
  
  -- Metadata
  model_version VARCHAR,
  processing_time_ms INT,
  cost_usd FLOAT,
  created_at TIMESTAMP
);
```

---

## API Endpoints (New)

### `/api/analysis/pro-analysis` (POST)
**Requires**: Pro tier, valid JWT
**Input**: Audio file (multipart/form-data)
**Output**: Comprehensive pro analysis

```json
{
  "transcript": "...",
  "metrics": {
    "duration": 45.5,
    "rms_energy": 0.234,
    "spectral_centroid": 2145.3,
    "mfcc_mean": [...],
    "speech_rate_wpm": 142,
    "silence_ratio": 0.08
  },
  "prosody": {
    "mean_pitch_hz": 156.4,
    "pitch_range": { "min": 95, "max": 245 },
    "pitch_variation_semitones": 4.2,
    "mean_intensity_db": 68.5,
    "intensity_variation": 3.2
  },
  "fillers": {
    "detected": [
      { "word": "like", "count": 12, "confidence": 0.94, "timestamps": [2.3, 5.1, ...] },
      { "word": "um", "count": 8, "confidence": 0.87, "timestamps": [...] }
    ],
    "total_count": 20,
    "filler_density": 0.045,
    "top_3": ["like", "um", "you know"]
  },
  "emotions": {
    "primary": "confident",
    "secondary": "engaged",
    "scores": { "happy": 0.65, "confident": 0.78, "anxious": 0.12 }
  },
  "gpt_analysis": {
    "summary": "...",
    "strengths": [...],
    "improvements": [...],
    "recommendations": [...],
    "confidence_score": 7.8,
    "communication_score": 8.2,
    "areas_to_work": [...]
  }
}
```

---

## Dependencies to Add

See `requirements.txt` updates:
- `openai==1.59.0` - GPT API
- `parselmouth==0.4.3` - Praat prosody analysis
- `transformers==4.45.0` - Emotion models
- `torch==2.1.0` - Required by transformers
- `pyannote-audio==3.1.1` - Speaker diarization + emotion (optional)
- `essentia==2.1b6.dev20240523` - Advanced audio features (optional)

---

## Cost Considerations

### API Calls (Per Pro Upload):
- **Whisper API**: $0.006 per minute (shared across users)
- **GPT-4 mini**: ~$0.30-0.50 per analysis (for synthesis)
- **Local models**: Free (parselmouth, transformers)

### Tiering Strategy:
- **Pro**: 50 advanced analyses/month (overages: $0.99 each)
- **Pro+**: Unlimited analyses + custom insights

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add dependencies to requirements.txt
- [ ] Create `services/pro_analyzer.py` module
- [ ] Implement audio feature extraction (librosa)
- [ ] Implement prosody analysis (parselmouth)
- [ ] Add database schema

### Phase 2: Filler Detection
- [ ] Build audio-based filler detection
- [ ] Implement timestamp alignment
- [ ] Combine audio + text signals
- [ ] Add confidence scoring

### Phase 3: AI Integration
- [ ] Integrate OpenAI Whisper API
- [ ] Add GPT synthesis endpoint
- [ ] Implement caching for cost optimization

### Phase 4: Polish & Deploy
- [ ] Emotion detection (optional)
- [ ] Performance optimization
- [ ] Testing & validation
- [ ] Merge to main

---

## Testing Strategy

### Unit Tests:
- Audio feature extraction accuracy
- Prosody analysis consistency
- Filler detection confidence

### Integration Tests:
- End-to-end pro analysis flow
- Timestamp alignment validation
- Database storage

### Load Tests:
- Concurrent analysis processing
- API timeout handling
- Cost tracking accuracy

