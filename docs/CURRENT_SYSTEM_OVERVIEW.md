# Current LucidSpeakAI System Overview

## Project Summary
**LucidSpeakAI** is a full-stack web application that analyzes speech and provides users with detailed insights on their communication effectiveness.

### Tech Stack
- **Frontend**: Next.js with React (TypeScript)
- **Backend**: FastAPI (Python 3.13)
- **Database**: Supabase (PostgreSQL)
- **Audio**: Google Cloud Speech-to-Text, librosa, pydub, audioread
- **Auth**: JWT tokens, bcrypt password hashing
- **Deployment**: Render (backend), Vercel (frontend)

---

## Backend Architecture (Current State)

### Core Files
- **`main.py`**: Primary FastAPI application (1691 lines)
- **`duda.py`**: Alternative/development version (814 lines)
- **`m.py`**: Testing/legacy version
- **`requirements.txt`**: Python dependencies

### Key Components

#### 1. **Authentication System**
```
- JWT-based with 7-day expiration
- Password requirements: 8+ chars, uppercase, number, symbol
- OAuth2PasswordBearer scheme
- Email validation (regex)
- Endpoints: /register, /token, /users/me
```

#### 2. **User Tier System**
```
- FREE: 5 minutes/month limit
- BASIC/PRO/PRO_PLUS: Higher limits (stored in Supabase)
- User object includes: email, tier, minutes_used, subscriptions
```

#### 3. **Audio Processing Pipeline**

**Step 1: Upload & Validation**
- Endpoint: `POST /upload-audio/?session_id=&locale=es|en`
- File validation (MIME type, size, duration)
- Audio format support: webm, mp3, wav, flac, opus
- Max duration: 30 minutes
- Rate limit: 30 uploads/minute

**Step 2: Acoustic Analysis** (Current)
```python
def analyze_acoustics(audio_path):
    # Converts to mono
    # Extracts samples using pydub
    # Pitch analysis using librosa piptrack
    # Returns:
    #   - duration (seconds)
    #   - pitch_variation (std deviation)
```

**Step 3: Transcription**
```
Duration < 1s:    → Skip transcription
1s < Duration < 65s:  → Google Cloud Speech API
Duration >= 65s:   → Local Whisper model
```

**Step 4: Speech Pattern Analysis** (Current)
```python
def analyze_conviction(transcript):
    # Detects 100+ filler words (Spanish + English)
    # Contextual filtering (doesn't count every "like")
    # Returns:
    #   - disfluency_count (fillers)
    #   - hedge_count (uncertain words)
    #   - detailed breakdown
    #   - pace calculation
```

**Step 5: Insights Generation** (Current)
- Endpoint: `POST /insights/`
- Hardcoded rules based on metrics
- Context-aware (presentation, interview, casual, etc.)
- Language detection (Spanish/English)
- Personalized action items

#### 4. **Session Management**
```
- Users create sessions before uploading
- Each session has: name, context, target_audience, goal
- Recordings linked to sessions
- Stored in Supabase
- Endpoints: /sessions/create, /sessions/list, /sessions/{id}
```

#### 5. **Subscription/Payment Integration**
```
- Endpoints for payment confirmation and tracking
- Stripe integration (via order IDs)
- Subscription status management
- Usage tracking against tier limits
```

---

## Data Models

### User (From Supabase)
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "tier": "free|basic|pro|pro_plus",
  "minutes_used": 45,
  "created_at": "2024-01-15T10:30:00Z",
  "subscription_status": "active|cancelled",
  "last_payment": "2024-10-01T00:00:00Z"
}
```

### Recording (Stored in Supabase)
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "user_id": "uuid",
  "transcript": "full text...",
  "metrics": {
    "pace": 142.5,
    "disfluencies_per_minute": 2.8,
    "pitch_variation": 45.3,
    "duration": 45.5,
    "hedge_count": 7,
    "total_words": 234
  },
  "insights_summary": "text...",
  "created_at": "2024-10-15T14:22:00Z"
}
```

---

## Current Limitations (Free/Basic Tiers)

### 1. Transcription Limitations
- Google Cloud Speech normalizes audio
- No filler word preservation
- Limited to 65 seconds before switching to local model
- Language limited to es-ES, en-US

### 2. Acoustic Analysis Limitations
- **Only pitch_variation captured**
- No:
  - Pitch range analysis
  - Energy/intensity tracking
  - Speaking rate precision
  - Vocal quality analysis (fry, strain, breathiness)

### 3. Filler Detection Limitations
- **Text-only approach**
- Misses acoustic patterns
- Can't distinguish:
  - Nervous vs intentional elongations
  - Filled pauses from breath pauses
- Limited confidence scoring

### 4. Insights Limitations
- **Hardcoded rules-based system**
- No AI understanding of context
- Generic recommendations
- Can't detect:
  - Emotional tone
  - Complex speech patterns
  - Nuanced communication issues

---

## API Endpoints Summary

### Auth Routes
- `POST /register` - Create account
- `POST /token` - Get JWT token
- `GET /users/me` - Get current user

### Session Routes
- `POST /sessions/create` - New session
- `GET /sessions/list` - List user sessions
- `GET /sessions/{session_id}` - Get session details

### Recording Routes
- `POST /upload-audio/` - Upload & analyze audio
- `POST /insights/` - Generate insights from metrics
- `POST /confirm-payment` - Payment processing

### System Routes
- `GET /` - Health check
- `GET /health` - Health status

---

## Dependency Highlights

### Audio Processing
- **librosa** (0.10.2) - Feature extraction, pitch analysis
- **pydub** (0.25.1) - Audio format conversion
- **soundfile** (0.12.1) - Wav file handling
- **audioread** (3.0.1) - Multi-format audio reading
- **scipy** (1.14.1) - Signal processing

### Google Cloud
- **google-cloud-speech** (2.27.0) - Transcription API
- **google-cloud-storage** (2.18.2) - File storage

### Database & Auth
- **supabase** (2.10.0) - Backend as a Service
- **python-jose[cryptography]** (3.3.0) - JWT handling
- **passlib[bcrypt]** (1.7.4) - Password hashing

### API & Utils
- **fastapi** (0.115.5) - Web framework
- **uvicorn[standard]** (0.32.1) - ASGI server
- **slowapi** (0.1.9) - Rate limiting
- **python-dotenv** (1.0.1) - Environment variables

---

## Performance Characteristics

### Upload Processing Time
- Small audio (< 30s): ~2-5 seconds
- Medium audio (30-60s): ~5-10 seconds
- Large audio (60s-30min): ~30-120 seconds
- Bottleneck: Google Cloud Speech API response time

### Database
- Queries cached where possible
- Supabase uses connection pooling
- Index on user_id and session_id for fast lookups

### Rate Limiting
- 30 uploads per minute per user/IP
- Enforced via slowapi middleware

---

## Current Session Flow Example

```
1. User logs in → Receives JWT token
2. User creates session
   {
     "name": "Practice Interview",
     "context": "interview",
     "target_audience": "corporate_recruiter",
     "goal": "persuade"
   }
3. User records 45-second audio clip
4. POST /upload-audio/
   - Audio validated
   - Acoustic metrics extracted
   - Google Cloud Speech transcribes
   - Conviction analysis on transcript
   - Recording saved to Supabase
   - Returns metrics + transcript
5. User requests insights
   POST /insights/
   - GPT-like suggestions generated (hardcoded rules)
   - Personalized actions returned
6. Results saved in session history
```

---

## Deployment Status

### Backend (Render)
- Deployment via `render-build.sh`
- Environment variables configured
- Google Cloud credentials via env var
- FFmpeg installed as system dependency

### Frontend (Vercel)
- Next.js deployment
- Connected to backend API
- Environment variables for API endpoints

---

## Next Steps (Pro Audio Analysis)

See `PRO_AUDIO_ANALYSIS_ARCHITECTURE.md` for detailed implementation plan for:
1. ✅ Adding OpenAI integration
2. ✅ Implementing prosody analysis
3. ✅ Enhancing filler detection
4. ✅ Adding emotion detection
5. ✅ Creating advanced insights engine

